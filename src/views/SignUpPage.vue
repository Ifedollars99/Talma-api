<template>
    <div class="min-h-screen taichi-background flex items-center justify-center px-4 py-8 relative overflow-hidden">

        <!-- Animated Yin Yang symbols - right side only -->
        <div class="absolute top-20 right-4 sm:top-40 sm:right-32 yin-yang-small floating-2"></div>
        <div class="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 yin-yang-small floating-4"></div>



        <!-- Signup Card -->
        <div class="relative w-full max-w-md z-10">
            <!-- Glassmorphism Effect -->
            <div class="bg-white/15 backdrop-blur-xl border border-gray-400/30 rounded-3xl shadow-2xl p-8 space-y-8">

                <!-- Header -->
                <div class="text-center space-y-2">
                    <div
                        class="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <i class="bi bi-mortarboard-fill text-white text-2xl"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p class="text-gray-700">Join Campus Today and get started</p>
                </div>

                <!-- Form -->
                <form @submit.prevent="signUp" class="space-y-6">

                    <!-- Category Selection -->
                    <div class="space-y-2">
                        <label for="category" class="block text-sm font-medium text-gray-800">
                            Category *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="bi bi-person-badge text-gray-600"></i>
                            </div>
                            <select id="category" v-model="category" required
                                class="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-400/40 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200 appearance-none"
                                :class="{ 'border-red-500 ring-1 ring-red-500': categoryError }">
                                <option value="" disabled class="bg-gray-100 text-gray-700">Select your category
                                </option>
                                <option value="student" class="bg-white text-gray-900">Student</option>
                                <option value="staff" class="bg-white text-gray-900">Staff/Lecturer</option>
                            </select>
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <i class="bi bi-chevron-down text-gray-600"></i>
                            </div>
                        </div>
                        <p v-if="categoryError" class="text-red-600 text-sm">{{ categoryError }}</p>
                    </div>

                    <!-- Username Input -->
                    <div class="space-y-2">
                        <label for="username" class="block text-sm font-medium text-gray-800">
                            Username *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="bi bi-person text-gray-600"></i>
                            </div>
                            <input id="username" v-model="username" type="text" required
                                class="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-400/40 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200"
                                placeholder="Create a username"
                                :class="{ 'border-red-500 ring-1 ring-red-500': usernameError }" />
                        </div>
                        <p v-if="usernameError" class="text-red-600 text-sm">{{ usernameError }}</p>
                    </div>

                    <!-- Email Input -->
                    <div class="space-y-2">
                        <label for="email" class="block text-sm font-medium text-gray-800">
                            Email Address *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="bi bi-envelope text-gray-600"></i>
                            </div>
                            <input id="email" v-model="email" type="email" required
                                class="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-400/40 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200"
                                placeholder="Enter your email"
                                :class="{ 'border-red-500 ring-1 ring-red-500': emailError }" />
                        </div>
                        <p v-if="emailError" class="text-red-600 text-sm">{{ emailError }}</p>
                    </div>

                    <!-- Password Input -->
                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-gray-800">
                            Password *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="bi bi-lock text-gray-600"></i>
                            </div>
                            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required
                                class="w-full pl-10 pr-12 py-3 bg-white/20 border border-gray-400/40 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200"
                                placeholder="Create a password"
                                :class="{ 'border-red-500 ring-1 ring-red-500': passwordError }" />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                            </button>
                        </div>
                        <p v-if="passwordError" class="text-red-600 text-sm">{{ passwordError }}</p>

                        <!-- Password Strength Indicator -->
                        <div v-if="password" class="space-y-2">
                            <div class="flex space-x-1">
                                <div v-for="i in 4" :key="i"
                                    class="h-1 flex-1 rounded-full transition-colors duration-200" :class="{
                                        'bg-red-400': passwordStrength >= i && passwordStrength < 2,
                                        'bg-yellow-400': passwordStrength >= i && passwordStrength >= 2 && passwordStrength < 3,
                                        'bg-green-400': passwordStrength >= i && passwordStrength >= 3,
                                        'bg-gray-400': passwordStrength < i
                                    }"></div>
                            </div>
                            <p class="text-xs text-gray-600">
                                Password strength: {{ passwordStrengthText }}
                            </p>
                        </div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="flex items-start space-x-3">
                        <input id="agreeTerms" v-model="agreeTerms" type="checkbox" required
                            class="mt-1 w-4 h-4 text-gray-800 bg-white/30 border border-gray-400 rounded focus:ring-gray-600 focus:ring-2"
                            :class="{ 'border-red-500 ring-1 ring-red-500': termsError }" />
                        <label for="agreeTerms" class="text-sm text-gray-700">
                            I agree to the
                            <a href="#"
                                class="text-gray-900 hover:text-gray-700 transition-colors font-medium underline">Terms
                                of Service</a>
                            and
                            <a href="#"
                                class="text-gray-900 hover:text-gray-700 transition-colors font-medium underline">Privacy
                                Policy</a>
                        </label>
                    </div>
                    <p v-if="termsError" class="text-red-600 text-sm">{{ termsError }}</p>

                    <!-- Submit Button -->
                    <button type="submit" :disabled="loading || !isFormValid"
                        class="w-full py-3 px-4 bg-black hover:from-gray-900 hover:to-black disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-transparent">
                        <span v-if="loading" class="flex items-center justify-center">
                            <i class="bi bi-arrow-clockwise animate-spin mr-3"></i>
                            Creating Account...
                        </span>
                        <span v-else class="flex items-center justify-center">
                            <i class="bi bi-person-plus mr-2"></i>
                            Create Account
                        </span>
                    </button>
                </form>

                <!-- Success/Error Messages -->
                <div v-if="message" class="rounded-lg p-4 text-center transition-all duration-300" :class="{
                    'bg-green-100/80 border border-green-400/50 text-green-800': messageType === 'success',
                    'bg-red-100/80 border border-red-400/50 text-red-800': messageType === 'error'
                }">
                    <div class="flex items-center justify-center space-x-2">
                        <i v-if="messageType === 'success'" class="bi bi-check-circle text-green-600"></i>
                        <i v-else-if="messageType === 'error'" class="bi bi-exclamation-circle text-red-600"></i>
                        <p class="font-medium">{{ message }}</p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center">
                    <p class="text-black text-sm">
                        Already have an account?
                        <router-link to="/signin"
                            class="text-black hover:text-gray-700 transition-colors font-medium underline">
                            Sign in
                        </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

// Reactive state
const category = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const agreeTerms = ref(false)
const message = ref('')
const messageType = ref('') // 'success' or 'error'
const loading = ref(false)
const showPassword = ref(false)
const router = useRouter()

// Error states
const categoryError = ref('')
const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const termsError = ref('')

// Password strength computation
const passwordStrength = computed(() => {
    if (!password.value) return 0
    let strength = 0

    if (password.value.length >= 8) strength++
    if (/[A-Z]/.test(password.value)) strength++
    if (/[a-z]/.test(password.value)) strength++
    if (/[0-9]/.test(password.value)) strength++
    if (/[^A-Za-z0-9]/.test(password.value)) strength++

    return Math.min(strength, 4)
})

const passwordStrengthText = computed(() => {
    switch (passwordStrength.value) {
        case 0:
        case 1: return 'Weak'
        case 2: return 'Fair'
        case 3: return 'Good'
        case 4: return 'Strong'
        default: return 'Weak'
    }
})

// Form validation
const isFormValid = computed(() => {
    return category.value.length > 0 &&
        username.value.length > 0 &&
        email.value.length > 0 &&
        password.value.length >= 6 &&
        agreeTerms.value &&
        !categoryError.value &&
        !usernameError.value &&
        !emailError.value &&
        !passwordError.value &&
        !termsError.value
})

// Validation functions
const validateCategory = () => {
    if (!category.value) {
        categoryError.value = 'Please select your category'
    } else {
        categoryError.value = ''
    }
}

const validateUsername = () => {
    if (username.value.length < 3) {
        usernameError.value = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
        usernameError.value = 'Username can only contain letters, numbers, and underscores'
    } else {
        usernameError.value = ''
    }
}

const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value)) {
        emailError.value = 'Please enter a valid email address'
    } else {
        emailError.value = ''
    }
}

const validatePassword = () => {
    if (password.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters'
    } else {
        passwordError.value = ''
    }
}

const validateTerms = () => {
    if (!agreeTerms.value) {
        termsError.value = 'You must agree to the terms and conditions'
    } else {
        termsError.value = ''
    }
}

// Watch for input changes to validate in real-time
watch(category, validateCategory)
watch(username, validateUsername)
watch(email, validateEmail)
watch(password, validatePassword)
watch(agreeTerms, validateTerms)

// Sign Up function
const signUp = async () => {
    // Validate all fields first
    validateCategory()
    validateUsername()
    validateEmail()
    validatePassword()
    validateTerms()

    if (!isFormValid.value) {
        return
    }

    loading.value = true
    message.value = ''

    try {
        const { error } = await supabase.auth.signUp({
            email: email.value,
            password: password.value,
            options: {
                data: {
                    username: username.value,
                    category: category.value,
                    user_type: category.value,
                    role: category.value // Just add this line
                }
            }
        })

        if (error) {
            message.value = error.message
            messageType.value = 'error'
        } else {
            message.value = 'Success! Check your email for a confirmation link.'
            messageType.value = 'success'

            alert('🎉 Make sure to verify the link sent to your email before you signin!!')

            // Clear form on success
            category.value = ''
            username.value = ''
            email.value = ''
            password.value = ''
            agreeTerms.value = false

            // Redirect to signin page after a short delay
            setTimeout(() => {
                router.push('/signin')
            }, 2000) // 2 second delay to let user see success message
        }
    } catch (error) {
        message.value = 'An unexpected error occurred. Please try again.'
        messageType.value = 'error'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* Taichi-inspired background */
.taichi-background {
    background: linear-gradient(135deg,
            #ffffff 0%,
            #f8f9fa 25%,
            #000000 25%,
            #1a1a1a 50%,
            #ffffff 50%,
            #f8f9fa 75%,
            #000000 75%,
            #1a1a1a 100%);
    background-size: 200px 200px;
    animation: taichi-flow 30s linear infinite;
}

/* Mobile optimizations */
@media (max-width: 640px) {
    .taichi-background {
        background-size: 150px 150px;
    }
}

@keyframes taichi-flow {
    0% {
        background-position: 0% 0%;
    }

    100% {
        background-position: 100% 100%;
    }
}

/* Yin Yang symbols */
.yin-yang-large {
    width: 600px;
    height: 600px;
    background: linear-gradient(to right, #000 50%, #fff 50%);
    border-radius: 50%;
    position: relative;
    animation: rotate-slow 40s linear infinite;
}

/* Mobile responsive yin yang */
@media (max-width: 640px) {
    .yin-yang-large {
        width: 300px;
        height: 300px;
    }
}

.yin-yang-large::before {
    content: '';
    position: absolute;
    top: 0;
    left: 25%;
    width: 50%;
    height: 50%;
    background: #fff;
    border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
}

.yin-yang-large::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 25%;
    width: 50%;
    height: 50%;
    background: #000;
    border-radius: 50% 50% 50% 50% / 0% 0% 100% 100%;
}

.yin-yang-small {
    width: 40px;
    height: 40px;
    background: linear-gradient(to right, #000 50%, #fff 50%);
    border-radius: 50%;
    position: relative;
    opacity: 0.4;
}

/* Mobile responsive small yin yang */
@media (min-width: 640px) {
    .yin-yang-small {
        width: 60px;
        height: 60px;
        opacity: 0.3;
    }
}

.yin-yang-small::before {
    content: '';
    position: absolute;
    top: 0;
    left: 25%;
    width: 50%;
    height: 50%;
    background: #fff;
    border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
}

.yin-yang-small::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 25%;
    width: 50%;
    height: 50%;
    background: #000;
    border-radius: 50% 50% 50% 50% / 0% 0% 100% 100%;
}

@keyframes rotate-slow {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes float-1 {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-30px) rotate(180deg);
    }
}

@keyframes float-2 {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-20px) rotate(-180deg);
    }
}

@keyframes float-3 {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-25px) rotate(180deg);
    }
}

@keyframes float-4 {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-35px) rotate(-180deg);
    }
}

.floating-1 {
    animation: float-1 8s ease-in-out infinite;
}

.floating-2 {
    animation: float-2 6s ease-in-out infinite;
}

.floating-3 {
    animation: float-3 10s ease-in-out infinite;
}

.floating-4 {
    animation: float-4 7s ease-in-out infinite;
}

/* Custom styles for select dropdown */
select option {
    background-color: #ffffff;
    color: #374151;
}

select:focus option:checked {
    background-color: #374151;
    color: white;
}
</style>