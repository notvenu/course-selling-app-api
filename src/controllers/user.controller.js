import { isValidObjectId } from "mongoose"
import { options } from "../constants.js"
import { User } from "../models/user.model.js"
import { Enrollment } from "../models/enrollment.model.js"
import { asyncHandler } from "../utils/asyncHandler.util.js"
import { apiError } from "../utils/apiError.util.js"
import { apiResponse } from "../utils/apiResponse.util.js"

const generateTokens = async (userId) => {
    try {
        if(!isValidObjectId(userId)){
            throw new apiError(400, "Invalid user id.")
        }
        const user = await User.findById(userId)
        if(!user){
            throw new apiError(404, "User not found with the given userId.")
        }
        const accessToken = await User.generateAccessToken()
        const refreshToken = await User.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken}
    } catch (error) {
        throw new apiError(500, "Something went wrong while generating tokens.")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, name, email, password, role } = req.body
    if([username, name, email, password, role].some((field) => field.trim() === "")){
        throw new apiError(400, "Name, email, password or role is invalid.")
    }
    // Username: alphanumeric, 3–20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
        throw new apiError(400, "Username must be alphanumeric and 3-20 characters long")
    }
    // Full name: letters and spaces only
    const nameRegex = /^[a-zA-Z ]{3,50}$/
    if (!nameRegex.test(name)) {
        throw new apiError(400, "Name must contain only letters and spaces..")
    }
    // Email: standard pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw new apiError(400, "Invalid email format.")
    }
    // Password: at least 6 characters, includes number and letter
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new apiError(400, "Password must be at least 8 characters and include at least one uppercase and one lowercase letter, one number and one special character.")
    }
    if(role !== ("Instructor" || "Student")){
        throw new apiError(400, "Role must be either 'Instructor' or 'Student'.")
    }
    const exitedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(exitedUser){
        throw new apiError(409, "User with this email or username already exits.")
    }
    const user = await User.create({
        username,
        name,
        email,
        password,
        role
    })
    const createdUser = User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new apiError(500, "User creation failed.")
    }
    return res.status(200).json( new apiResponse(200,{ user },"User registered successfully.") )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if(!(username || email)){
        throw new apiError(400,"Username or email is required to login")
    }
    if(!password){
        throw new apiError(400, "Password is required to login.")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new apiError(404, "User not found with the given email or username.")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new apiError(401, "Invalid password.")
    }
    const { accessToken, refreshToken } = await generateTokens(user?._id)
    const loggedInUser = await User.findById(user?._id).select("-password -refreshToken")
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json( new apiResponse(200, loggedInUser, "User logged in successfully.") )
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: refreshToken,
        },
        {
            new: true
        }
    )
    if(!user){
        throw new apiError(404, "User not found.")
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json( new apiResponse(200, {}, "User logged out successfully.") )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken
    if(!incomingRefreshToken){
        throw new apiError(401, "Refresh token is required to refresh access token.")
    }
    try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new apiError(404, "User not found with the given refresh token.")
        }
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Invalid refresh token.")
        }
        const { accessToken, refreshToken } = await generateTokens(req.user?._id)
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json( new apiResponse(200, {}, "Access Token refreshed successfully.") )
    } catch (error) {
        console.error("Error refreshing Access Token:", error)
        throw new apiError(401, "Invalid refresh token.")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword} = req.body
    if(!(oldPassword && newPassword && confirmNewPassword)){
        throw new apiError(400, "Old password, new password and confirm new password are required to change password.")
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new apiError(400, "New Password must be at least 8 characters and include at least one uppercase and one lowercase letter, one number and one special character.")
    }
    if(newPassword !== oldPassword){
        throw new apiError(400, "New password and old password must be different.")
    }
    if(newPassword !== confirmNewPassword){
        throw new apiError(400, "New password and confirm new password do not match.")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404, "User not found with the given userId.")
    }
    const isPasswordValid = await user.isPasswordCorrect(user.password, oldPassword)
    if(!isPasswordValid){
        throw new apiError(401, "Old password is incorrect.")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json( new apiResponse(200, {}, "Password changed successfully.") )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    
    if (!isValidObjectId(userId)) {
        throw new apiError(400, "Invalid user id.");
    }
    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "enrollments",
                localField: "_id",
                foreignField: "student",
                as: "enrollments",
                pipeline: [
                    {
                        $lookup: {
                            from: "courses",
                            localField: "course",
                            foreignField: "_id",
                            as: "courseDetails",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "instructors",
                                        localField: "_id",
                                        foreignField: "courses",
                                        as: "instructorMapping"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$instructorMapping",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "instructorMapping.user_id",
                                        foreignField: "_id",
                                        as: "instructorInfo",
                                        pipeline: [
                                            {
                                                $project: {
                                                    name: 1,
                                                    email: 1,
                                                    username: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "categories",
                                        localField: "category",
                                        foreignField: "_id",
                                        as: "category"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$category",
                                        preserveNullAndEmptyArrays: true
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "modules",
                                        localField: "_id",
                                        foreignField: "course",
                                        as: "modules",
                                        pipeline: [
                                            {
                                                $lookup: {
                                                    from: "lessons",
                                                    localField: "_id",
                                                    foreignField: "module",
                                                    as: "lessons"
                                                }
                                            },
                                            {
                                                $project: {
                                                    title: 1,
                                                    description: 1,
                                                    lessonCount: { $size: "$lessons" }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$courseDetails"
                    },
                    {
                        $project: {
                            enrolled_at: 1,
                            progress: 1,
                            completed: 1,
                            course: {
                                _id: "$courseDetails._id",
                                title: "$courseDetails.title",
                                description: "$courseDetails.description",
                                price: "$courseDetails.price",
                                thumbnail_url: "$courseDetails.thumbnail",
                                published: "$courseDetails.published",
                                instructor: { $arrayElemAt: ["$courseDetails.instructorInfo", 0] },
                                category: "$courseDetails.category",
                                modules: "$courseDetails.modules",
                                totalModules: { $size: "$courseDetails.modules" },
                                totalLessons: {
                                    $sum: {
                                        $map: {
                                            input: "$courseDetails.modules",
                                            as: "module",
                                            in: "$$module.lessonCount"
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                enrollmentStats: {
                    totalEnrollments: { $size: "$enrollments" },
                    completedCourses: {
                        $size: {
                            $filter: {
                                input: "$enrollments",
                                cond: { $eq: ["$$this.completed", true] }
                            }
                        }
                    },
                    inProgressCourses: {
                        $size: {
                            $filter: {
                                input: "$enrollments",
                                cond: { $eq: ["$$this.completed", false] }
                            }
                        }
                    },
                    averageProgress: {
                        $cond: {
                            if: { $gt: [{ $size: "$enrollments" }, 0] },
                            then: {
                                $divide: [
                                    {
                                        $sum: {
                                            $map: {
                                                input: "$enrollments",
                                                as: "enrollment",
                                                in: "$$enrollment.progress"
                                            }
                                        }
                                    },
                                    { $size: "$enrollments" }
                                ]
                            },
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $project: {
                password_hash: 0,
                refresh_token: 0
            }
        }
    ])
    if (!user || user.length === 0) {
        throw new apiError(404, "User not found.");
    }
    return res.status(200).json(
        new apiResponse(200, { user: user[0] }, "Current User Fetched Successfully.")
    )
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID.");
  }
  const user = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) }
    },
    {
      $lookup: {
        from: "lessons",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "courses",
              localField: "course",
              foreignField: "_id",
              as: "courseInfo",
              pipeline: [
                {
                  $lookup: {
                    from: "instructors",
                    localField: "_id",
                    foreignField: "courses",
                    as: "instructorMap"
                  }
                },
                {
                  $unwind: {
                    path: "$instructorMap",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: "users",
                    localField: "instructorMap.user_id",
                    foreignField: "_id",
                    as: "instructorDetails",
                    pipeline: [
                      { $project: { name: 1 } }
                    ]
                  }
                },
                {
                  $unwind: {
                    path: "$instructorDetails",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $project: {
                    title: 1,
                    thumbnail_url: 1,
                    instructorName: "$instructorDetails.name"
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: "$courseInfo",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              video_url: 1,
              completed: 1,
              courseName: "$courseInfo.title",
              courseThumbnail: "$courseInfo.thumbnail_url",
              instructorName: "$courseInfo.instructorName",
              lessonName: "$title"
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        watchHistory: 1
      }
    }
  ]);

  if (!user || user.length === 0) {
    throw new apiError(404, "User not found.");
  }

  return res.status(200).json( new apiResponse(200, {user: user[0].name,username: user[0].username,watchHistory: user[0].watchHistory}, "Watch history fetched successfully.") )
})

const getUserProgress = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid user id.")
    }
    const enrollments = await Enrollment.find({student: userId}).populate("course", "title thumbnail").populate("instructor", "name username")
    if(!enrollments || enrollments.length === 0){
        throw new apiError(404, "User is not enrolled in any course.")
    }
    const progressData = enrollments.map((enrollment) => {
        return {
            courseId: enrollment.course._id,
            courseTitle: enrollment.course.title,
            courseThumbnail: enrollment.course.thumbnail_url,
            progress: parseFloat(enrollment.progress.toFixed(2)),
            completed: enrollment.completed,
            enrolledAt: enrollment.enrolled_at
        }
    })
    if(!progressData){
        throw new apiError(500, "Failed to fetch user progress data.")
    }
    return res.status(200).json(new apiResponse(200, { progressData }, "User progress data fetched successfully."))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { username, name, email } = req.body
    if( !(name || username || email ) ) {
        throw new apiError(400, "At least one field is required to update")
    }
    if(email && email !== req.user?.email){
        const emailExits = await User.findOne({email})
        if(!emailExits){
            throw new apiError(409, "Email already exits.")
        }
    }
    if(username && username !== req.user?.username){
        const usernameExits = await User.findOne({username})
        if(!usernameExits){
            throw new apiError(409, "Username already exits.")
        }
    }
    // Username: alphanumeric, 3–20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (username && !usernameRegex.test(username)) {
        throw new apiError(400, "Username must be alphanumeric and 3-20 characters long")
    }
    // Full name: letters and spaces only
    const nameRegex = /^[a-zA-Z ]{3,50}$/
    if (name && !nameRegex.test(name)) {
        throw new apiError(400, "Name must contain only letters and spaces..")
    }
    // Email: standard pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
        throw new apiError(400, "Invalid email format.")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                name: name || req.user.name,
                username: username || req.user.username,
                email: email || req.user.email
            }
        }
    ).select("-password -refreshToken")
    if(!user){
        throw new apiError(404, "User not found")
    }
    return res.status(200).json( new apiResponse(200, user, "User account details updated successfully.") )
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid user id.")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new apiError(404, "User not found.")
    }
    await user.deleteOne()
    const deletedUser = await User.findById(userId)
    if(deletedUser){
        throw new apiError(500, "User account deletion failed. Please try again.")
    }
    return res.status(200).json( new apiResponse(200, {}, "User account deleted successfully."))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, getUserWatchHistory, getUserProgress, updateAccountDetails, deleteUserAccount }