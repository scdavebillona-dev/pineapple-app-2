#!/bin/bash

# PineAI System - Database Schema
# Persistent storage using React Native AsyncStorage

# Users Table (stored as Array)
users = [
  {
    id: string (generated),
    username: string (unique),
    email: string (unique, validated),
    password: string (plaintext - consider hashing for production),
    createdAt: timestamp
  }
]

# Scan History (per user, stored locally)
scans = [
  {
    id: string (generated),
    timestamp: string (ISO format),
    imageUri: string (local file path),
    variety: string ("Queen" or "Smooth Cayenne"),
    confidence: number (0.0 - 1.0),
    all_predictions: {
      "Queen": number,
      "Smooth Cayenne": number
    },
    userId: string (reference to user.id)
  }
]

# Storage Locations:
# Android: /data/data/com.pineappleai/files/RCTAsyncStorage_V1/
# iOS: Documents/Persist/
# Web/Emulator: Temporary storage per session

# Current Implementation:
# - registeredUsers: Array of user objects (persisted)
# - currentUser: Current logged-in user object (persisted)
# - scanResults: Recent scans (up to 20 per session)

# Note: All data stored locally on device
# No cloud sync - data lost if app uninstalled
# For production: Consider adding:
# - Database encryption
# - Cloud backup
# - User data export
