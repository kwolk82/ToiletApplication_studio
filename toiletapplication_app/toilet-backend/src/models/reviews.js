// src/models/Review.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true }, // 화면 표시용
    key: { type: String, required: true, index: true },      // 장소 키
    toilet: {
      id: { type: String, default: null },
      name: { type: String, required: true, trim: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
    },
    comment: { type: String, default: "" },                  // 댓글 (선택)
    rating: {
      type: Number,                                          // 1~5 (선택)
      min: [1, "rating>=1"],
      max: [5, "rating<=5"],
    },
  },
  { timestamps: true }
);

// 별점 문서는 유저당 장소 1개로 제한(댓글-only 문서는 제외)
ReviewSchema.index(
  { userId: 1, key: 1 },
  {
    unique: true,
    partialFilterExpression: { rating: { $exists: true } }, // rating 있을 때만 유니크 적용
  }
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
