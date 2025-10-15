const express = require("express");
const router = express.Router();
const offersController = require("../controllers/offersController");

router.post("/", offersController.createOffer);
router.get("/", offersController.listOffers);
router.get("/:id", offersController.getOffer);
router.put("/:id", offersController.updateOffer);
router.delete("/:id", offersController.deleteOffer);
router.put("/:offerId/assign/:packageId", offersController.assignOffer);
router.delete("/:offerId/assign/:packageId", offersController.unassignOffer);

module.exports = router;
