package com.edu.coro.api

data class User(
    val _id: String? = null,
    val email: String? = null,
    val role: String? = null,
    val fullName: String? = null,
    val ci: String? = null,
    val studentId: String? = null
)

data class Student(
    val _id: String, val ci: String, val fullName: String,
    val email: String, val section: String, val status: String
)

data class Grade(
    val _id: String? = null, val studentId: String? = null, val subject: String? = null,
    val cut1: Double? = null, val cut2: Double? = null, val cut3: Double? = null,
    val finalGrade: Double? = null
)

data class GradeInfo(
    val studentId: String? = null, val fullName: String? = null,
    val promedioGeneral: Double = 0.0, val status: String = "Activo",
    val enRiesgo: Boolean = false
)

data class Attendance(
    val _id: String, val studentId: String, val date: String,
    val status: String, val section: String? = null
)

data class AttendanceStats(
    val total: Int = 0, val ausentes: Int = 0, val presentes: Int = 0,
    val justificados: Int = 0, val porcentajeInasistencias: Double = 0.0
)

data class ApiResponse<T>(val ok: Boolean, val message: String? = null, val data: T? = null)

interface Endpoints {
    @retrofit2.http.POST("/api/users/login")
    fun login(@retrofit2.http.Body body: Map<String, Any>): okhttp3.Call
}
