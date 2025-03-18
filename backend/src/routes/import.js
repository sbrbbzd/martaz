const express = require('express');
const router = express.Router();
const { importFromUrl, getSupportedSources } = require('../controllers/importController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/import/url:
 *   post:
 *     summary: Import a listing from external URL
 *     description: Scrapes data from a URL and creates a new listing
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL to scrape data from
 *               categoryId:
 *                 type: string
 *                 description: Category ID for the new listing
 *     responses:
 *       201:
 *         description: Listing imported successfully
 *       400:
 *         description: Invalid URL or data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/url', auth(), importFromUrl);

/**
 * @swagger
 * /api/import/sources:
 *   get:
 *     summary: Get supported import sources
 *     description: Returns a list of websites that are optimized for import
 *     tags: [Import]
 *     responses:
 *       200:
 *         description: List of supported sources
 */
router.get('/sources', getSupportedSources);

module.exports = router; 