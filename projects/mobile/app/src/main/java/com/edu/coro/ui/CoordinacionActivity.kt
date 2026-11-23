package com.edu.coro.ui

import android.app.Activity
import android.os.Bundle

class CoordinacionActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_coordinacion)
        title = "EduCoro AI - Coordinacion"
    }
}
