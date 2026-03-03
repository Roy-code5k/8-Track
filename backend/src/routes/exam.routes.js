const express = require('express');
const { getExams, createExam, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', getExams);
router.post('/', createExam);
router.delete('/:id', deleteExam);

module.exports = router;
