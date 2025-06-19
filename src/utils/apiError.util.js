export class apiError extends Error {
    constructor(
        statuscode,
        message = "Internal Server Error",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statuscode = statuscode,
        this.data = null,
        this.errors = errors,
        this.message = message,
        this.success = false
        if(stack){
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}