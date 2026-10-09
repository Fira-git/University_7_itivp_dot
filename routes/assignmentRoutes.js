const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, deleteAssignment } = require('../controllers/assignmentController');
const { verifyToken, roleGuard } = require('../middlewares/authMiddleware');

// access control: all routes require authentication
router.get('/', verifyToken, getAssignments);

// Post /assignments — pass only moderators and admins
router.post('/', verifyToken, roleGuard(['moderator', 'admin']), createAssignment);

// DELETE /assignments/:id — pass only admins
router.delete('/:id', verifyToken, roleGuard(['admin']), deleteAssignment);

module.exports = router;