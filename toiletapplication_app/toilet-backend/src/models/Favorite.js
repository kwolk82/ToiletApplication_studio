// src/models/Favorite.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const ToiletSchema = new Schema(
  {
    id: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    lat: {
      type: Number,
      required: true,
      validate: { validator: Number.isFinite, message: "lat must be a finite number" },
    },
    lng: {
      type: Number,
      required: true,
      validate: { validator: Number.isFinite, message: "lng must be a finite number" },
    },
    address: { type: String, default: undefined, trim: true },
  },
  { _id: false }
);

const FavoriteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    key: { type: String, required: true },     // ✅ 핵심
    toilet: { type: ToiletSchema, required: true },
  },
  { timestamps: true }
);

// ✅ 유니크 인덱스: userId + key
FavoriteSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);

