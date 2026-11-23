package com.edu.coro.ui

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import com.edu.coro.R
import com.edu.coro.utils.ApiHelper
import com.edu.coro.utils.HttpClient

class LoginActivity : Activity() {
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private val api by lazy { ApiHelper() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        HttpClient.appContext = applicationContext
        setContentView(R.layout.activity_login)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        btnLogin.setOnClickListener { doLogin() }
    }

    private fun doLogin() {
        val email = etEmail.text.toString()
        val password = etPassword.text.toString()
        if (email.isBlank() || password.isBlank()) { Toast.makeText(this, "Completa email y contrasena", Toast.LENGTH_SHORT).show(); return }
        btnLogin.isEnabled = false
        Thread {
            val res = api.login(email, password)
            runOnUiThread {
                btnLogin.isEnabled = true
                if (res.ok) {
                    val user = res.data?.get("user")
                    val role = user?.get("role") ?: "Docente"
                    val target = when (role) {
                        "Docente" -> DashDocenteActivity::class.java
                        "Estudiante" -> DashEstudianteActivity::class.java
                        "Coordinador" -> CoordinacionActivity::class.java
                        else -> LoginActivity::class.java
                    }
                    startActivity(Intent(this, target))
                    finish()
                } else {
                    Toast.makeText(this, res.message ?: "Error de login", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }
}
