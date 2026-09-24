<template>
    <!-- ============ MOBILE X / TWITTER HOME (mobile only) ============ -->
    <div class="lg:hidden -mx-4 -mt-4">
        <!-- Sticky For You / Following / Discover tabs -->
        <div class="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E0D8]">
            <div class="grid grid-cols-3">
                <button @click="homeFeedTab = 'foryou'"
                    class="relative py-3.5 text-[15px] transition-colors"
                    :class="homeFeedTab === 'foryou' ? 'font-bold text-[#1C2B39]' : 'font-medium text-[#8B95A0]'">
                    <span>For You</span>
                    <span v-if="homeFeedTab === 'foryou'"
                        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#C6862E] rounded-full"></span>
                </button>
                <button @click="homeFeedTab = 'following'"
                    class="relative py-3.5 text-[15px] transition-colors"
                    :class="homeFeedTab === 'following' ? 'font-bold text-[#1C2B39]' : 'font-medium text-[#8B95A0]'">
                    <span>Following</span>
                    <span v-if="homeFeedTab === 'following'"
                        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#C6862E] rounded-full"></span>
                </button>
                <button @click="homeFeedTab = 'discover'"
                    class="relative py-3.5 text-[15px] transition-colors"
                    :class="homeFeedTab === 'discover' ? 'font-bold text-[#1C2B39]' : 'font-medium text-[#8B95A0]'">
                    <span>Discover</span>
                    <span v-if="homeFeedTab === 'discover'"
                        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#C6862E] rounded-full"></span>
                </button>
            </div>
        </div>

        <!-- Mobile composer (X style) -->
        <div v-if="homeFeedTab !== 'discover'" class="bg-white border-b border-[#E4E0D8] px-4 py-3 flex space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-[#C6862E] to-[#B37726] rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white text-sm font-semibold">{{ username.charAt(0).toUpperCase() }}</span>
            </div>
            <button @click="showCreatePost = true"
                class="flex-1 text-left text-[15px] text-[#8B95A0] pt-2">
                Share something educational...
            </button>
            <button @click="showCreatePost = true"
                class="self-center w-9 h-9 rounded-full bg-[#FBF3E4] text-[#C6862E] flex items-center justify-center">
                <i class="bi bi-image"></i>
            </button>
        </div>

        <!-- Mobile create-post sheet -->
        <div v-if="showCreatePost" class="bg-white border-b border-[#E4E0D8] p-4 space-y-3">
            <textarea v-model="newPost.content"
                placeholder="Share educational content, tips, resources, or questions..."
                class="w-full p-3 border border-[#E4E0D8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#C6862E] text-[15px] text-[#1C2B39]"
                rows="3"></textarea>
            <select v-model="newPost.subject"
                class="w-full px-3 py-2.5 border border-[#E4E0D8] rounded-xl text-sm text-[#1C2B39] focus:outline-none focus:ring-2 focus:ring-[#C6862E]">
                <option value="">Select a subject...</option>
                <option v-for="course in courses" :key="course.id" :value="course.title">{{ course.title }}</option>
            </select>
            <div v-if="newPost.mediaUrl" class="rounded-xl overflow-hidden border border-[#E4E0D8]">
                <img v-if="newPost.mediaType === 'image'" :src="newPost.mediaUrl" class="w-full max-h-56 object-cover">
                <video v-else-if="newPost.mediaType === 'video'" :src="newPost.mediaUrl" class="w-full max-h-56 object-cover" controls></video>
            </div>
            <div class="flex items-center justify-between">
                <label for="fileUploadMobile" class="w-10 h-10 rounded-full bg-[#FBF3E4] text-[#C6862E] flex items-center justify-center cursor-pointer">
                    <i class="bi bi-image"></i>
                </label>
                <input type="file" @change="handleFileUpload" accept="image/*,video/*" class="hidden" id="fileUploadMobile">
                <div class="flex space-x-2">
                    <button @click="showCreatePost = false" class="px-4 py-2 text-sm text-[#5B6672] font-medium">Cancel</button>
                    <button @click="createPost" :disabled="!newPost.content.trim()"
                        class="px-5 py-2 bg-[#1C2B39] text-white rounded-full text-sm font-semibold disabled:opacity-40">Post</button>
                </div>
            </div>
        </div>

        <!-- DISCOVER tab: Active Courses + Community -->
        <div v-if="homeFeedTab === 'discover'" class="bg-[#F7F5F0]">
            <div class="bg-white px-4 pt-4 pb-2 border-b border-[#E4E0D8]">
                <h3 class="font-semibold text-[17px] text-[#1C2B39] mb-3">Active Courses</h3>
                <div class="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x">
                    <div v-for="course in courses" :key="course.id"
                        class="min-w-[220px] snap-start bg-[#F7F5F0] border border-[#E4E0D8] rounded-2xl p-4">
                        <div class="w-10 h-10 bg-[#FBF3E4] rounded-xl flex items-center justify-center mb-3">
                            <i class="bi bi-book text-lg text-[#C6862E]"></i>
                        </div>
                        <p class="font-semibold text-[15px] text-[#1C2B39] leading-snug">{{ course.title }}</p>
                        <p class="text-xs text-[#8B95A0] mt-1">{{ course.students }} students</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 py-3">
                    <div class="bg-[#E9F2EF]/60 border border-[#D4E8E1] rounded-2xl p-3">
                        <p class="text-[11px] font-semibold text-[#8B95A0] uppercase">Messages</p>
                        <p class="text-2xl font-bold text-[#1C2B39]">{{ messages.length }}</p>
                        <p class="text-[11px] text-[#2F6F5E]">unread chats</p>
                    </div>
                    <div class="bg-[#FBF3E4]/60 border border-[#E4E0D8] rounded-2xl p-3">
                        <p class="text-[11px] font-semibold text-[#8B95A0] uppercase">Community</p>
                        <p class="text-2xl font-bold text-[#1C2B39]">{{ posts.length }}</p>
                        <p class="text-[11px] text-[#C6862E]">posts in feed</p>
                    </div>
                </div>
            </div>
            <p class="px-4 py-2 text-xs font-semibold text-[#8B95A0] uppercase tracking-wide">Community posts</p>
        </div>

        <!-- MOBILE FEED: X-style rows -->
        <div class="bg-white divide-y divide-[#E4E0D8] border-b border-[#E4E0D8]">
            <div v-if="filteredMobilePosts.length === 0" class="p-10 text-center">
                <p class="text-[#8B95A0]">No posts yet. Be the first to share!</p>
            </div>
            <article v-for="post in filteredMobilePosts" :key="post.id" class="px-4 py-3 flex space-x-3 active:bg-[#FAFAF8]">
                <div class="w-10 h-10 bg-[#EFEAE0] rounded-full flex items-center justify-center flex-shrink-0 border border-[#E4E0D8]">
                    <span class="text-[#1C2B39] text-sm font-semibold">{{ post.author.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 text-[15px] min-w-0">
                        <span class="font-bold text-[#1C2B39] truncate">{{ post.author }}</span>
                        <span v-if="post.authorRole === 'lecturer'" class="text-[11px] px-1.5 py-0.5 bg-[#FBF3E4] text-[#C6862E] rounded-full font-semibold flex-shrink-0">Lecturer</span>
                        <span class="text-[#8B95A0] text-[13px] flex-shrink-0">· {{ formatTimeAgo(post.timestamp) }}</span>
                        <button v-if="post.author === username" @click="deletePost(post.id)" class="ml-auto text-[#8B95A0] p-1">
                            <i class="bi bi-trash text-sm"></i>
                        </button>
                    </div>
                    <p v-if="post.subject" class="text-[13px] text-[#C6862E] font-medium">{{ post.subject }}</p>
                    <p class="text-[15px] text-[#1C2B39] leading-normal mt-0.5">{{ post.content }}</p>
                    <div v-if="post.mediaType === 'image'" class="mt-2 rounded-2xl overflow-hidden border border-[#E4E0D8]">
                        <img :src="post.mediaUrl" class="w-full max-h-72 object-cover">
                    </div>
                    <div v-else-if="post.mediaType === 'video'" class="mt-2 rounded-2xl overflow-hidden border border-[#E4E0D8]">
                        <video :src="post.mediaUrl" class="w-full max-h-72 object-cover" controls></video>
                    </div>
                    <div class="flex items-center justify-between mt-2 -ml-2 max-w-[300px]">
                        <button @click="likePost(post.id)" class="flex items-center gap-1 text-[#8B95A0] p-2">
                            <i class="bi bi-heart text-[17px]"></i><span class="text-[13px]">{{ post.likes }}</span>
                        </button>
                        <button class="flex items-center gap-1 text-[#8B95A0] p-2">
                            <i class="bi bi-chat text-[17px]"></i><span class="text-[13px]">{{ post.comments }}</span>
                        </button>
                        <button class="text-[#8B95A0] p-2"><i class="bi bi-share text-[17px]"></i></button>
                        <button class="text-[#8B95A0] p-2"><i class="bi bi-bookmark text-[17px]"></i></button>
                    </div>
                </div>
            </article>
        </div>

        <!-- Mobile FAB (compose) -->
        <button @click="showCreatePost = !showCreatePost"
            class="fixed bottom-[78px] right-4 z-40 w-14 h-14 bg-[#C6862E] rounded-full shadow-xl flex items-center justify-center text-[#1C2B39]">
            <i class="bi bi-plus-lg text-2xl"></i>
        </button>
    </div>

    <!-- Welcome Section - More Spacious & Premium (DESKTOP ONLY) -->
    <div class="hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#1C2B39] via-[#1C2B39] to-[#2A3F54] rounded-2xl p-12 text-white shadow-lg">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-[#C6862E]/5 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 w-60 h-60 bg-[#2F6F5E]/5 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
            <p class="text-[#C6862E] text-sm font-medium tracking-wide mb-2 uppercase">Welcome back</p>
            <h1 class="font-heading text-5xl font-semibold mb-4">{{ username }}</h1>
            <p class="text-lg text-white/70 max-w-2xl leading-relaxed">
                You have <span class="text-[#C6862E] font-medium">{{ notifications }} new notifications</span> and 
                <span class="text-[#2F6F5E] font-medium">{{ pendingAssignments }} pending assignments</span> waiting for your attention.
            </p>
        </div>
    </div>

    <!-- Expanded Quick Stats - Premium Grid (DESKTOP ONLY) -->
    <div class="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Active Courses Stat -->
        <div class="group relative bg-white rounded-2xl overflow-hidden border border-[#E4E0D8] shadow-sm hover:shadow-xl transition-all duration-500">
            <div class="absolute inset-0 bg-gradient-to-br from-[#FBF3E4]/30 via-transparent to-transparent"></div>
            <div class="relative p-8 h-full flex flex-col">
                <div class="flex items-start justify-between mb-8">
                    <div>
                        <p class="text-[#8B95A0] text-sm font-medium tracking-wide mb-3">ACTIVE COURSES</p>
                        <p class="font-heading text-6xl font-semibold text-[#1C2B39]">{{ courses.length }}</p>
                        <p class="text-[#8B95A0] text-sm mt-2">courses in progress</p>
                    </div>
                    <div class="w-16 h-16 bg-gradient-to-br from-[#FBF3E4] to-[#F5E6C8] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <i class="bi bi-book text-3xl text-[#C6862E]"></i>
                    </div>
                </div>
                
                <!-- Courses Preview -->
                <div class="mt-auto pt-6 border-t border-[#E4E0D8]">
                    <div class="space-y-2">
                        <div v-for="(course) in courses.slice(0, 3)" :key="course.id" class="flex items-center text-sm text-[#5B6672]">
                            <span class="inline-block w-2 h-2 bg-[#C6862E] rounded-full mr-3"></span>
                            {{ course.title }}
                        </div>
                    </div>
                    <button v-if="courses.length > 3" class="mt-4 text-[#C6862E] text-sm font-medium hover:text-[#B37726] transition-colors">
                        View all {{ courses.length - 3 }} courses →
                    </button>
                </div>
            </div>
        </div>

        <!-- Messages Stat -->
        <div class="group relative bg-white rounded-2xl overflow-hidden border border-[#E4E0D8] shadow-sm hover:shadow-xl transition-all duration-500">
            <div class="absolute inset-0 bg-gradient-to-br from-[#E9F2EF]/30 via-transparent to-transparent"></div>
            <div class="relative p-8 h-full flex flex-col">
                <div class="flex items-start justify-between mb-8">
                    <div>
                        <p class="text-[#8B95A0] text-sm font-medium tracking-wide mb-3">MESSAGES</p>
                        <p class="font-heading text-6xl font-semibold text-[#1C2B39]">{{ messages.length }}</p>
                        <p class="text-[#8B95A0] text-sm mt-2">unread conversations</p>
                    </div>
                    <div class="w-16 h-16 bg-gradient-to-br from-[#E9F2EF] to-[#D4E8E1] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <i class="bi bi-chat-dots text-3xl text-[#2F6F5E]"></i>
                    </div>
                </div>
                
                <!-- Messages Summary -->
                <div class="mt-auto pt-6 border-t border-[#E4E0D8]">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-[#5B6672]">Response time</span>
                            <span class="text-[#2F6F5E] font-medium">2.4 hours</span>
                        </div>
                        <div class="w-full h-1.5 bg-[#E4E0D8] rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-[#2F6F5E] to-[#4A9B89] rounded-full" style="width: 78%"></div>
                        </div>
                    </div>
                    <button class="mt-4 text-[#2F6F5E] text-sm font-medium hover:text-[#1F5242] transition-colors">
                        Open inbox →
                    </button>
                </div>
            </div>
        </div>

        <!-- Community Posts Stat -->
        <div class="group relative bg-white rounded-2xl overflow-hidden border border-[#E4E0D8] shadow-sm hover:shadow-xl transition-all duration-500">
            <div class="absolute inset-0 bg-gradient-to-br from-[#EFEAE0]/40 via-transparent to-transparent"></div>
            <div class="relative p-8 h-full flex flex-col">
                <div class="flex items-start justify-between mb-8">
                    <div>
                        <p class="text-[#8B95A0] text-sm font-medium tracking-wide mb-3">COMMUNITY POSTS</p>
                        <p class="font-heading text-6xl font-semibold text-[#1C2B39]">{{ posts.length }}</p>
                        <p class="text-[#8B95A0] text-sm mt-2">in the feed</p>
                    </div>
                    <div class="w-16 h-16 bg-gradient-to-br from-[#EFEAE0] to-[#E4D9CC] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <i class="bi bi-people text-3xl text-[#1C2B39]"></i>
                    </div>
                </div>
                
                <!-- Engagement Stats -->
                <div class="mt-auto pt-6 border-t border-[#E4E0D8]">
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-[#5B6672]">Your engagement</span>
                            <span class="text-[#1C2B39] font-medium">12 interactions</span>
                        </div>
                        <div class="flex gap-2">
                            <span class="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-[#FBF3E4] text-[#C6862E] rounded-full">
                                <i class="bi bi-heart text-xs"></i>
                                <span>28 likes</span>
                            </span>
                            <span class="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-[#E9F2EF] text-[#2F6F5E] rounded-full">
                                <i class="bi bi-chat text-xs"></i>
                                <span>8 comments</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Post Section - Refined (DESKTOP ONLY) -->
    <div class="hidden lg:block bg-white rounded-2xl border border-[#E4E0D8] overflow-hidden shadow-sm">
        <div class="p-8 bg-gradient-to-r from-white via-[#FBF3E4]/20 to-white">
            <div class="flex items-center space-x-4 mb-6">
                <div class="w-14 h-14 bg-gradient-to-br from-[#C6862E] to-[#B37726] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <span class="text-white text-lg font-semibold">{{ username.charAt(0).toUpperCase() }}</span>
                </div>
                <button @click="showCreatePost = true" 
                    class="flex-1 text-left px-6 py-3.5 bg-[#F7F5F0] rounded-full text-[#8B95A0] hover:bg-[#EFE9DE] transition-all duration-300 focus:ring-2 focus:ring-[#C6862E] focus:ring-offset-2 font-medium">
                    Share something educational with your community...
                </button>
            </div>
            
            <!-- Create Post Modal/Expanded Form -->
            <div v-if="showCreatePost" class="border-t border-[#E4E0D8] pt-8 space-y-6 animate-fade-in">
                <div>
                    <label class="block text-sm font-medium text-[#5B6672] mb-3">Your insight</label>
                    <textarea v-model="newPost.content" 
                        placeholder="Share educational content, tips, resources, or questions..."
                        class="w-full p-4 border border-[#E4E0D8] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#C6862E] focus:border-transparent text-[#1C2B39] placeholder-[#8B95A0] leading-relaxed"
                        rows="4"></textarea>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-3">Subject</label>
                        <select v-model="newPost.subject" 
                            class="w-full px-4 py-2.5 border border-[#E4E0D8] rounded-xl text-[#1C2B39] focus:outline-none focus:ring-2 focus:ring-[#C6862E] focus:border-transparent font-medium">
                            <option value="">Select a subject...</option>
                            <option v-for="course in courses" :key="course.id" :value="course.title">
                                {{ course.title }}
                            </option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-[#5B6672] mb-3">Add media</label>
                        <input type="file" @change="handleFileUpload" accept="image/*,video/*" 
                            class="hidden" ref="fileInput" id="fileUpload">
                        <label for="fileUpload" 
                            class="w-full px-4 py-2.5 bg-gradient-to-r from-[#FBF3E4] to-[#F5E6C8] text-[#C6862E] rounded-xl cursor-pointer hover:from-[#F5E6C8] hover:to-[#EFDAB0] transition-all duration-300 flex items-center justify-center space-x-2 font-medium border border-[#E4E0D8]">
                            <i class="bi bi-image text-lg"></i>
                            <span>Choose image or video</span>
                        </label>
                    </div>
                </div>
                
                <!-- Media Preview -->
                <div v-if="newPost.mediaUrl" class="relative rounded-xl overflow-hidden border border-[#E4E0D8]">
                    <img v-if="newPost.mediaType === 'image'" :src="newPost.mediaUrl" 
                        class="w-full max-h-64 object-cover" alt="Preview">
                    <video v-else-if="newPost.mediaType === 'video'" :src="newPost.mediaUrl" 
                        class="w-full max-h-64 object-cover" controls></video>
                    <button @click="newPost.mediaUrl = ''; newPost.mediaType = 'none'" 
                        class="absolute top-3 right-3 bg-[#8B3A3A]/90 hover:bg-[#732E2E] text-white rounded-lg w-8 h-8 flex items-center justify-center text-lg transition-colors shadow-md">
                        ✕
                    </button>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button @click="showCreatePost = false" 
                        class="px-6 py-2.5 text-[#5B6672] hover:text-[#1C2B39] transition-colors font-medium">
                        Cancel
                    </button>
                    <button @click="createPost" 
                        :disabled="!newPost.content.trim()"
                        class="px-8 py-2.5 bg-gradient-to-r from-[#C6862E] to-[#B37726] text-white rounded-xl hover:shadow-lg hover:from-[#B37726] hover:to-[#9D6620] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium">
                        Share Post
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Educational Posts Feed - Premium Treatment (DESKTOP ONLY) -->
    <div class="hidden lg:block bg-white rounded-2xl border border-[#E4E0D8] overflow-hidden shadow-sm">
        <div class="px-8 py-8 border-b border-[#E4E0D8] bg-gradient-to-r from-white via-[#EFEAE0]/10 to-white">
            <h2 class="font-heading text-3xl font-semibold text-[#1C2B39]">Educational Community</h2>
            <p class="text-[#8B95A0] mt-2">Connect, learn, and share knowledge with your peers</p>
        </div>
        
        <div class="divide-y divide-[#E4E0D8]">
            <div v-if="posts.length === 0" class="p-12 text-center">
                <div class="w-16 h-16 bg-[#FBF3E4] rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="bi bi-chat-dots text-2xl text-[#C6862E]"></i>
                </div>
                <p class="text-[#8B95A0] text-lg">No posts yet. Be the first to share something!</p>
            </div>

            <div v-for="post in posts" :key="post.id" class="p-8 hover:bg-[#FAFAF8] transition-colors duration-300">
                <!-- Post Header -->
                <div class="flex items-start space-x-4 mb-6">
                    <div class="w-14 h-14 bg-gradient-to-br from-[#EFEAE0] to-[#E4D9CC] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#E4E0D8]">
                        <span class="text-[#1C2B39] text-lg font-semibold">{{ post.author.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-3 flex-wrap">
                            <h3 class="font-semibold text-lg text-[#1C2B39]">{{ post.author }}</h3>
                            <span :class="['px-3 py-1 rounded-full text-xs font-semibold',
                                post.authorRole === 'lecturer' ? 'bg-[#FBF3E4] text-[#C6862E] border border-[#E4E0D8]' : 'bg-[#E9F2EF] text-[#2F6F5E] border border-[#D4E8E1]']">
                                {{ post.authorRole === 'lecturer' ? '👨‍🏫 Lecturer' : '📚 Student' }}
                            </span>
                        </div>
                        <div class="flex items-center space-x-3 text-sm text-[#8B95A0] mt-2 flex-wrap">
                            <span v-if="post.subject" class="flex items-center space-x-1 bg-[#F7F5F0] px-3 py-1 rounded-full">
                                <i class="bi bi-bookmark"></i>
                                <span>{{ post.subject }}</span>
                            </span>
                            <span class="flex items-center space-x-1">
                                <i class="bi bi-clock"></i>
                                <span>{{ formatTimeAgo(post.timestamp) }}</span>
                            </span>
                        </div>
                    </div>
                    
                    <!-- Delete button -->
                    <div v-if="post.author === username" class="flex-shrink-0">
                        <button @click="deletePost(post.id)" 
                            class="text-[#8B95A0] hover:text-[#8B3A3A] hover:bg-[#FBE4E4] p-2.5 rounded-lg transition-all duration-300"
                            title="Delete post">
                            <i class="bi bi-trash text-lg"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Post Content -->
                <div class="mb-6 ml-18">
                    <p class="text-base text-[#1C2B39] leading-relaxed">{{ post.content }}</p>
                </div>
                
                <!-- Post Media -->
                <div v-if="post.mediaType === 'image'" class="mb-6 ml-18 relative group rounded-xl overflow-hidden border border-[#E4E0D8]">
                    <img :src="post.mediaUrl" 
                        class="w-full max-h-96 object-cover" 
                        :alt="post.content">
                    <button 
                        @click="downloadMedia(post.mediaUrl, `${post.author}-${post.id}.jpg`)"
                        class="absolute top-4 right-4 bg-[#1C2B39]/80 hover:bg-[#1C2B39] text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                        title="Download image">
                        <i class="bi bi-download text-lg"></i>
                        <span class="text-sm font-medium">Download</span>
                    </button>
                </div>
                
                <div v-else-if="post.mediaType === 'video'" class="mb-6 ml-18 relative group rounded-xl overflow-hidden border border-[#E4E0D8]">
                    <video :src="post.mediaUrl" 
                        class="w-full max-h-96 object-cover" 
                        controls></video>
                    <button 
                        @click="downloadMedia(post.mediaUrl, `${post.author}-${post.id}.mp4`)"
                        class="absolute top-4 right-4 bg-[#1C2B39]/80 hover:bg-[#1C2B39] text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                        title="Download video">
                        <i class="bi bi-download text-lg"></i>
                        <span class="text-sm font-medium">Download</span>
                    </button>
                </div>
                
                <!-- Post Actions -->
                <div class="flex items-center justify-between pt-6 border-t border-[#E4E0D8] ml-18">
                    <div class="flex items-center space-x-8">
                        <button @click="likePost(post.id)" 
                            class="flex items-center space-x-2 text-[#8B95A0] hover:text-[#C6862E] group transition-colors">
                            <div class="p-2 rounded-lg group-hover:bg-[#FBF3E4] transition-colors">
                                <i class="bi bi-heart text-lg"></i>
                            </div>
                            <span class="text-sm font-medium">{{ post.likes }}</span>
                        </button>
                        <button class="flex items-center space-x-2 text-[#8B95A0] hover:text-[#2F6F5E] group transition-colors">
                            <div class="p-2 rounded-lg group-hover:bg-[#E9F2EF] transition-colors">
                                <i class="bi bi-chat text-lg"></i>
                            </div>
                            <span class="text-sm font-medium">{{ post.comments }}</span>
                        </button>
                        <button class="flex items-center space-x-2 text-[#8B95A0] hover:text-[#1C2B39] group transition-colors">
                            <div class="p-2 rounded-lg group-hover:bg-[#EFEAE0] transition-colors">
                                <i class="bi bi-share text-lg"></i>
                            </div>
                            <span class="text-sm font-medium">Share</span>
                        </button>
                    </div>
                    <button class="text-[#8B95A0] hover:text-[#C6862E] p-2 rounded-lg hover:bg-[#FBF3E4] transition-all duration-300">
                        <i class="bi bi-bookmark text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Define props to receive data from parent component
const props = defineProps({
    courses: {
        type: Array,
        default: () => []
    },
    messages: {
        type: Array,
        default: () => []
    },
    uploads: {
        type: Array,
        default: () => []
    },
    posts: {
        type: Array,
        default: () => []
    },
    username: {
        type: String,
        default: 'Student'
    },
    notifications: {
        type: Number,
        default: 0
    }
})

// Define emits for communicating with parent
const emit = defineEmits(['create-post', 'like-post', 'upload-file', 'delete-post', 'download-media'])

const pendingAssignments = ref(4)
const showCreatePost = ref(false)
const homeFeedTab = ref('foryou')
const newPost = ref({
    content: '',
    subject: '',
    mediaType: 'none',
    mediaFile: null,
    mediaUrl: ''
})

// Mobile X-style filtering: For You = all, Following = lecturers, Discover = all (courses shown above)
const filteredMobilePosts = computed(() => {
    if (homeFeedTab.value === 'following') {
        const lecturers = props.posts.filter(p => p.authorRole === 'lecturer')
        return lecturers.length ? lecturers : props.posts
    }
    return props.posts
})

// Local functions
const createPost = () => {
    if (!newPost.value.content.trim()) return
    
    emit('create-post', {
        content: newPost.value.content,
        subject: newPost.value.subject,
        mediaType: newPost.value.mediaType,
        mediaUrl: newPost.value.mediaUrl
    })
    
    // Reset form
    newPost.value = {
        content: '',
        subject: '',
        mediaType: 'none',
        mediaFile: null,
        mediaUrl: ''
    }
    showCreatePost.value = false
}

const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        newPost.value.mediaFile = file
        newPost.value.mediaUrl = URL.createObjectURL(file)
        
        if (file.type.startsWith('image/')) {
            newPost.value.mediaType = 'image'
        } else if (file.type.startsWith('video/')) {
            newPost.value.mediaType = 'video'
        }
        
        emit('upload-file', file)
    }
}

const likePost = (postId) => {
    emit('like-post', postId)
}

const deletePost = (postId) => {
    emit('delete-post', postId)
}

const downloadMedia = (mediaUrl, fileName) => {
    emit('download-media', mediaUrl, fileName)
}

const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');

.font-heading {
    font-family: 'Lora', Georgia, serif;
    letter-spacing: -0.01em;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}

/* Smooth transitions for interactive elements */
:root {
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced focus states for accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
    outline: 2px solid #C6862E;
    outline-offset: 2px;
}

/* Refined scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #F7F5F0;
}

::-webkit-scrollbar-thumb {
    background: #C6862E;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #B37726;
}
</style>