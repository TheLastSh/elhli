package com.edu.coro.ui

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

class DashDocenteActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dash_docente)
        title = "EduCoro AI - Docente"
    }
}
