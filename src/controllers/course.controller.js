import { Course } from "../models/course.model.js"
import { User } from "../models/user.model.js"
import { Category } from "../models/category.model.js"
import { asyncHandler } from "../utils/asyncHandler.util.js"
import { apiError } from "../utils/apiError.util.js"
import { apiResponse } from "../utils/apiResponse.util.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.util.js"
import { isValidObjectId } from "mongoose"

const createCourse = asyncHandler(async (req, res) => {
    const { title, description, price, category } = req.body
    if([title, description, price, category].some((field) => field?.trim() === "")){
        throw new apiError(400, "All fields are required.")
    }
    const descriptionRegeX = /^[a-zA-Z0-9\s.,!?'"-]{0,150}$/;
    if(!descriptionRegeX.test(description)){
        throw new apiError(400, "Description must be a string with a maximum length of 150 characters and can include letters, numbers, spaces, and punctuation.")
    }
    const existingCategory = await Category.find({ name: category.trim() })
    if(!existingCategory || existingCategory.length === 0){
        throw new apiError(404, "Category not found.Create a new category first or select other as category.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found.")
    }
    if(!user?.role === "Instructor"){
        throw new apiError(403, "You are not authorized to create a course. Only instructors can create courses.")
    }
    const thumbnailFilePath = req.files && req.files.thumbnail && req.files.thumbnail[0] && req.files.thumbnail[0].path
    if(!thumbnailFilePath){
        throw new apiError(400, "Thumbnail is required.")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailFilePath)
    const course = await Course.create({
        title: title.trim(),
        description: description.trim(),
        price: price.trim(),
        thumbnail,
        instructor: user._id,
        category: existingCategory._id
    })
    const createdCourse = await Course.findById(course?._id)
    if(!createdCourse){
        throw new apiError(500, "Course creation failed.")
    }
    return res.status(200).json( new apiResponse(200, { createdCourse }, "Course created successfully."))
})

const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params
    if(!isValidObjectId(courseId)){
        throw new apiError(400, "Invalid course ID.")
    }
    const course = await Course.findById(courseId).populate({path: "instructor",populate: {path: "user_id",model: "User",select: "name username email"}}).populate("category", "name")
    if(!course){
        throw new apiError(404, "Course not found.")
    }
    if(!course.published){
        throw new apiError(404, "Course not published yet.")
    }
    return res.status(200).json( new apiResponse(200, { course }, "Course fetched successfully."))
})

const getCourseByTitle = asyncHandler(async (req, res) => {
    const { title } = req.body
    if(!title.trim()){
        throw new apiError(400, "Title is required.")
    }
    const course = await Course.findOne({ title: title.trim() }).populate({path: "instructor",populate: {path: "user_id",model: "User",select: "name username email"}}).populate("category", "name")
    if(!course){
        throw new apiError(404, "Course not found with the given title.")
    }
    if(!course.published){
        throw new apiError(404, "Course not published yet.")
    }
    return res.status(200).json( new apiResponse(200, { course }, "Course fetched successfully."))
})

const getAllCourses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, instructorId, categoryId } = req.query
    const filter = {}
    if(query) {
        filter.title = { $regex: query, $options: "i" }
    }
    if(instructorId) {
        if(!isValidObjectId(instructorId)){
            throw new apiError(400, "Invalid instructor ID.")
        }
        filter.instructor = instructorId
    }
    if(categoryId) {
        if(!isValidObjectId(categoryId)){
            throw new apiError(400, "Invalid category ID.")
        }
        filter.category = categoryId
    }
    const sort = {}
    const allowedSortFields = ["title", "price", "createdAt"];
    if (sortBy && allowedSortFields.includes(sortBy)) {
        sort[sortBy] = sortType === "asc" ? 1 : -1;
    }
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        populate: [
            { path: "instructor", populate: { path: "user_id", model: "User", select: "name username email" } },
            { path: "category", select: "name" }
        ]
    }
    const courses = await Course.paginate(filter, options)
    if (!courses || courses.docs.length === 0){
        throw new apiError(404, "No courses found.")
    }
    return res.status(200).json( new apiResponse(200, { courses }, "Courses fetched successfully."))
})

const toggleCoursePublish = asyncHandler(async (req, res) => {
    const { courseId } = req.params
    if(!isValidObjectId(courseId)){
        throw new apiError(400, "Invalid course Id.")
    }
    const course = await Course.findById(courseId)
    if(!course){
        throw new apiError(404, "Course not found.")
    }
    const isPublished = course.published
    if(isPublished){
        course.published = !isPublished
        await course.save()
    }else {
        course.published = !isPublished
        await course.save()
    }
    const updatedCourse = await Course.findById(course?._id)
    if(updatedCourse.published === isPublished){
        throw new apiError(500, "Course toggle failed.")
    }
    return res.status(200).json( new apiResponse(200, { updatedCourse }, `Course ${updatedCourse.published? "Published" : "Unpublished"} successfully.`) )
})

const updateCourseDetails = asyncHandler(async (req, res) => {
    const { courseId } = req.params
    if(!isValidObjectId(courseId)){
        throw new apiError(400, "Invalid course id.")
    }
    const { title, description, price, category } = req.body
    if(!(title || description || price || category)){
        throw new apiError(400, "At least one field is required to update the course.")
    }
    const descriptionRegeX = /^[a-zA-Z0-9\s.,!?'"-]{0,150}$/
    if(description && !descriptionRegeX.test(description)){
        throw new apiError(400, "Description must be a string with a maximum length of 150 characters and can include letters, numbers, spaces, and punctuation.")
    }
    const existingCategory = await Category.find({ name: category.trim() })
    if(category && (!existingCategory || existingCategory.length === 0)){
        throw new apiError(404, "Category not found. Create a new category first or select other as category.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found.")
    }
    const course = await Course.findById(courseId)
    if(!course){
        throw new apiError(404, "Course not found.")
    }
    if(course.instructor !== user._id){
        throw new apiError(403, "You are not authorized to update this course. Only the instructor who created the course can update it.")
    }
    const updatedCourse = await Course.findByIdAndUpdate(
        course._id,
        {
            $set: {
                ...(title && { title }),
                ...(description && { description }),
                ...(price && { price }),
                ...(category && { category })
            }
        },
        { new: true }
    ).populate({path: "instructor",populate: {path: "user_id",model: "User",select: "name username email"}}).populate("category", "name")
    return res.status(200).json( new apiResponse(200, { updatedCourse }, "Course details updated successfully."))
})

const updateCourseThumbnail = asyncHandler(async (req, res) => {
    const { courseId } = req.params
    if(!isValidObjectId(courseId)){
        throw new apiError(400, "Invalid course id.")
    }
    const course = await Course.findById(courseId)
    if(!course){
        throw new apiError(404, "Course not found.")
    }
    if(course.instructor !== user._id){
        throw new apiError(403, "You are not authorized to update this course. Only the instructor who created the course can update it.")
    }
    const thumbnailFilePath = req.files && req.files.thumbnail && req.files.thumbnail[0] && req.files.thumbnail[0].path
    if(!thumbnailFilePath){
        throw new apiError(400, "Thumbnail is required.")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailFilePath)
    const oldThumbnailUrl = course.thumbnail
    await deleteFromCloudinary(oldThumbnailUrl)
    course.thumbnail = thumbnail
    try {
        await course.save()
    } catch (error) {
        throw new apiError(500, "Thumbnail updation failed.")
    }
    return res.status(200).json( new apiResponse(200, { course }, "Thumbnail updated successfully."))
})

const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params
    if(!isValidObjectId(courseId)){
        throw new apiError(400, "Invalid course id.")
    }
    const course = await Course.findById(courseId)
    if(!course){
        throw new apiError(404, "Course not found.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found.")
    }
    if(course.instructor !== user._id){
        throw new apiError(403, "You are not authorized to update this course. Only the instructor who created the course can delete it.")
    }
    await deleteFromCloudinary(course.thumbnail)
    try {
        await course.deleteOne()
    } catch (error) {
        throw new apiError(500, "Course deletion failed.")
    }
    return res.status(200).json( new apiResponse(200, {}, "Course delete successfully."))
})

export { createCourse, updateCourseDetails, deleteCourse , getCourseById, getCourseByTitle, getAllCourses, toggleCoursePublish, updateCourseThumbnail }