import { Router } from "express";
import { createCourse, updateCourseDetails, deleteCourse , getCourseById, getCourseByTitle, getAllCourses, toggleCoursePublish, updateCourseThumbnail } from "../controllers/course.controller";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/:courseId").get(getCourseById)
router.route("/course-by-title").get(getCourseByTitle)
//Secure Routes
router.use(verifyJWT)
router.route("/").get(getAllCourses)
router.route("/create").post(upload.single({name: "thumbnail",maxCount: 1,}), createCourse)
router.route("/:courseId/update-course-details").patch(updateCourseDetails)
router.route("/:courseId/update-course-thumbnail").patch(upload.single({name: "thumbnail",maxCount: 1,}), updateCourseThumbnail)
router.route("/:courseId").delete(deleteCourse)
router.route("/:courseId/publish").patch(toggleCoursePublish)

export default router