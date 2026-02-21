const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const translate = require("google-translate-api-x");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb://127.0.0.1:27017/task1db")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

const Comment = require("./models/Comment");

//   ADD COMMENT
app.post("/add-comment", async (req, res) => {
  try {
    const { username, commentText, city } = req.body;

    if (!username || !commentText || !city) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const nameCityPattern = /^[\p{L}\s]+$/u;

    if (!nameCityPattern.test(username)) {
      return res.status(400).json({
        message: "Invalid name",
      });
    }

    if (!nameCityPattern.test(city)) {
      return res.status(400).json({
        message: "Invalid city",
      });
    }

    // Block dangerous special characters
    const invalidPattern = /[<>${};]/;

    if (invalidPattern.test(commentText)) {
      return res.status(400).json({
        message: "Invalid special characters detected",
      });
    }

    const newComment = new Comment({
      username,
      commentText,
      city,
    });

    await newComment.save();

    res.status(201).json({
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding comment",
    });
  }
});

//   GET COMMENTS
app.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
});

//   LIKE
app.put("/like/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.likes += 1;
    await comment.save();

    res.json({ message: "Liked successfully", data: comment });
  } catch (error) {
    res.status(500).json({ message: "Error liking comment" });
  }
});

app.put("/dislike/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.dislikes += 1;

    if (comment.dislikes >= 2) {
      await Comment.findByIdAndDelete(req.params.id);
      return res.json({
        message: "Comment removed due to 2 dislikes",
      });
    }

    await comment.save();
    res.json({ message: "Disliked successfully", data: comment });
  } catch (error) {
    res.status(500).json({ message: "Error disliking comment" });
  }
});

//   TRANSLATE
app.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    const result = await translate(text, { to: targetLanguage });

    res.json({
      translatedText: result.text,
    });
  } catch (error) {
    res.status(500).json({ message: "Translation failed" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
