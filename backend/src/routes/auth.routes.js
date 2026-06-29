import express from "express"
import { Router } from "express"

import {
    googleRedirect,
    googleCallback
}
from "../controllers/auth.controller.js"

const router = Router()

router.get('/google', googleRedirect)
router.get("/google/callback", googleCallback)

export default router