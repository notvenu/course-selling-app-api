import multer from "multer"

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, ".public/temp")
    },
    filename: function(req, file, cb){
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/\s+/g, '-')       // replace spaces with dashes
      .replace(/[^\w\-]/g, '')    // remove special characters

    const uniqueName = `${baseName}-${timestamp}${ext}`;
        cb(null, uniqueName)
    }
})

export const upload = multer({ storage })