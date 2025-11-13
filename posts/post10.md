---
title: "Image Metadata Checker"
date: "2025-11-13"
tags: ["photography", "python"]
image: "https://raw.githubusercontent.com/jtgis/blog/main/posts/exif.png"
---

A Python script for validating image metadata in JPEG files. This tool checks whether images contain GPS coordinates (latitude, longitude, altitude), full camera orientation data (roll, pitch, yaw), and sensor specifications (make, model, focal length, sensor width). The script parses EXIF and XMP metadata structures using only Python standard libraries, making it suitable for environments where external dependencies are not available. Results are exported to a CSV file with true/false flags for each metadata category, allowing users to identify which images in a collection meet specific metadata requirements for photogrammetry, mapping, or other geospatial applications.

Link to the repository:
[cameraMetadataChecker](https://github.com/jtgis/cameraMetadataChecker)
