import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { apiError } from "../utils/apiError.util.js";
import { apiResponse } from "../utils/apiResponse.util.js";
import { isValidObjectId } from "mongoose";

const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if(![name, description].some((field) => field.trim() === "")){
        throw new apiError(400, "Name and description both the fields are required.")
    }
    const descriptionRegeX = /^[a-zA-Z0-9\s.,!?'"-]{0,150}$/;
    if(!descriptionRegeX.test(description)){
        throw new apiError(400, "Description must be a string with a maximum length of 150 characters and can include letters, numbers, spaces, and punctuation.")
    }
    const existingCategory = await Category.find({ name: name.trim() })
    if(existingCategory || existingCategory.length !== 0){
        throw new apiError(404, "Category already exits.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found. Please login to create a category.")
    }
    if(user?.role !== "Instructor"){
        throw new apiError(401, "You are not authorized to create a category. Only instructors can create categories.")
    }
    const category = await Category.create({
        name,
        description,
        createdBy: user?._id
    })
    if(!category){
        throw new apiError(500, "Category creation failed. Please try again later.")
    }
    return res.status(200).json( new apiResponse(200, { category }, `${category.name} category created successfully.`) )
})

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params
    if(!isValidObjectId(categoryId)){
        throw new apiError(400, "Invalid category Id.")
    }
    const category = await Category.findById(categoryId)
    if(!category){
        throw new apiError(404, "Category doesn't exits.")
    }
    const { name, description } = req.body
    if(!(name.trim() || description.trim())){
        throw new apiError(400, "Name or description is required to update the category.")
    }
    const descriptionRegeX = /^[a-zA-Z0-9\s.,!?'"-]{0,150}$/;
    if(!descriptionRegeX.test(description)){
        throw new apiError(400, "Description must be a string with a maximum length of 150 characters and can include letters, numbers, spaces, and punctuation.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found. Please login to update the category.")
    }
    if(user?._id !== category?.createdBy){
        throw new apiError(401, "You are not authorized to update the category. Only instructor who created the category can update it.")
    }
    const updatedCategory = await Category.findByIdAndUpdate(
        category._id,
        {
            $set: {
                ...(name.trim() && {name}),
                ...(description.trim() && {description})
            }
        }
    ).populate("createdBy", "name username")
    if(!updatedCategory){
        throw new apiError(500, "Category update failed. Please try again later.")
    }
    return res.status(200).json( new apiResponse(200, { updatedCategory }, `${updatedCategory.name} category updated successfully.`) )
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params
    if(!isValidObjectId(categoryId)){
        throw new apiError(400, "Invalid category Id.")
    }
    const category = await Category.findById(categoryId)
    if(!category){
        throw new apiError(404, "Category not found.")
    }
    if(category?.createdBy !== req.user?._id){
        throw new apiError(401, "You are not authorized to delete this category. Only the instructor who created the category can delete it.")
    }
    await category.deleteOne()
    return res.status(200).json( new apiResponse(200, {}, "Category deleted successfully.") )
})

const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params
    if(!isValidObjectId(categoryId)){
        throw new apiError(400, "Invalid category Id.")
    }
    const category = await Category.findById(categoryId).populate("createdBy", "name username")
    if(!category){
        throw new apiError(404, "Category not found.")
    }
    return res.status(200).json( new apiResponse(200, { category }, "Category retrieved successfully.") )
})

const getCategoryByTitle = asyncHandler(async (req, res) => {
    const { name } = req.body
    if(name.trim() === ""){
        throw new apiError(400, "Invalid category name.")
    }
    const category = await Category.find({ name: name.trim()}).populate("createdBy", "name username")
    if(!category){
        throw new apiError(404, "Category not found.")
    }
    return res.status(200).json( new apiResponse(200, { category }, "Category retrieved successfully.") )
})

const getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, categoryId } = req.query
    const filter = {}
    if(query){
        filter.title = { $regex: query, $options: "i" }
    }
    if(categoryId){
        if(!isValidObjectId(categoryId)){
            throw new apiError(400, "Invalid category Id.")
        }
        filter.category = categoryId
    }
    const sort = {}
    if(sortBy){
        sort[sortBy] = sortType === "asc" ? 1 : -1
    }
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        populate: [{path: "cretedBy", select:"username name"}]
    }
    const categories = await Category.paginate(filter, options)
    if(!categories || categories.docs.length === 0){
        throw new apiError(404, "No categories found.")
    }
    return res.status(200).json( new apiResponse(200, { categories }, "Categories fetched successfully.") )
})

export { createCategory, updateCategory, deleteCategory, getCategoryById, getCategoryByTitle, getAllCategories }