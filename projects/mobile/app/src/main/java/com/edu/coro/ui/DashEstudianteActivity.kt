package com.edu.coro.ui

import android.app.Activity
import android.os.Bundle

class DashEstudianteActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dash_estudiante)
        title = "EduCoro AI - Estudiante"
    }
}
