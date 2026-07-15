# Course Management System

## Overview
Course management system allow student register and manage their courses in GA 

## Screenshots

## Technologies Used
- HTML
- CSS
- JavaScript
- MongoDB
- Express.js
- EJS

## Getting Started

## Installation

## User Stories

## CREATE

* As an admin, I want to create a new course with a code, name, credit hours, and department so that students can enroll in it.
* As a student, I want to enroll in an available course so that it appears in my schedule.
* As an admin, I want to add an instructor and assign them to courses so that each course has a teacher.

## READ

* As a student, I want to browse all available courses so that I can decide what to enroll in.
* As a student, I want to search courses by name or code and filter by department or semester so that I can find courses quickly.
* As a user, I want to open a single course to see its description, prerequisites, schedule, and enrolled count.
* As a student, I want to see a list of my current enrollments so that I know my schedule.
* As an instructor, I want to see the list of students enrolled in my course so that I can track attendance.

## UPDATE

* As an admin, I want to update a course's name, credits, capacity, or schedule so that the catalog stays accurate.
* As a student, I want to edit my email and contact info so that my records stay current.
* As an admin, I want to change the instructor assigned to a course so that staffing changes are reflected.
* As an instructor, I want to enter or update grades for enrolled students so that results are recorded.

## DELETE

* As an admin, I want to remove a course from the catalog so that discontinued courses aren't offered.
* As a student, I want to drop a course I'm enrolled in so that it's removed from my schedule.
* As an admin, I want to delete a student record so that inactive students are cleared.
* As an admin, I want to delete an instructor so that former staff aren't listed.

CROSS-CUTTING

* As a user, I want to log in with my credentials so that I only see what my role permits.

## Database Design


## Routes

| Method | Route | Description |
|---------|-------|-------------|
| GET | / | Home page |
| GET | /listings | List all listings |
| GET | /listings/new | New listing form |
| POST | /listings | Create listing |
| GET | /listings/:id | View listing |
| GET | /listings/:id/edit | Edit listing form |
| PUT | /listings/:id | Update listing |
| DELETE | /listings/:id | Delete listing |


## Features


## Future Enhancements


## Credits