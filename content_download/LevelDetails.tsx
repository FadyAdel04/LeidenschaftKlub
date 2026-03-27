<!DOCTYPE html>

<html class="scroll-smooth" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Level B1: Intermediate Mastery | Leidenschaft Klub</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;800&amp;family=Inter:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "on-primary-fixed": "#410003",
                        "outline-variant": "#e4beba",
                        "on-primary-fixed-variant": "#93000e",
                        "on-secondary-fixed": "#1c1b1b",
                        "on-tertiary-fixed": "#2c1600",
                        "primary-fixed": "#ffdad6",
                        "outline": "#8f706c",
                        "inverse-on-surface": "#f1f1ec",
                        "surface-variant": "#e3e3de",
                        "surface-container-low": "#f4f4ef",
                        "error-container": "#ffdad6",
                        "inverse-surface": "#2f312e",
                        "on-tertiary-fixed-variant": "#623f18",
                        "on-secondary": "#ffffff",
                        "error": "#ba1a1a",
                        "surface-bright": "#fafaf5",
                        "on-surface": "#1a1c19",
                        "tertiary-fixed-dim": "#f0bd8b",
                        "primary-container": "#c62828",
                        "on-tertiary-container": "#ffe2c9",
                        "secondary-fixed": "#e5e2e1",
                        "on-error-container": "#93000a",
                        "on-secondary-container": "#636262",
                        "on-primary": "#ffffff",
                        "tertiary-container": "#885f35",
                        "on-secondary-fixed-variant": "#474746",
                        "tertiary": "#6c4820",
                        "secondary-container": "#e2dfde",
                        "secondary": "#5f5e5e",
                        "surface-container": "#eeeee9",
                        "on-tertiary": "#ffffff",
                        "surface": "#fafaf5",
                        "on-background": "#1a1c19",
                        "on-error": "#ffffff",
                        "surface-tint": "#b91d20",
                        "background": "#fafaf5",
                        "on-primary-container": "#ffe0dd",
                        "primary": "#a20513",
                        "surface-container-highest": "#e3e3de",
                        "secondary-fixed-dim": "#c8c6c5",
                        "surface-container-lowest": "#ffffff",
                        "on-surface-variant": "#5b403d",
                        "surface-container-high": "#e8e8e3",
                        "primary-fixed-dim": "#ffb4ac",
                        "inverse-primary": "#ffb4ac",
                        "tertiary-fixed": "#ffdcbd",
                        "surface-dim": "#dadad5"
                    },
                    fontFamily: {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1.5rem;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body selection:bg-primary/20 selection:text-primary">
<!-- Top Navigation Bar -->
<nav class="fixed top-0 w-full z-50 bg-[#fafaf5]/80 backdrop-blur-md dark:bg-zinc-900/80 shadow-sm shadow-black/5">
<div class="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
<div class="text-2xl font-bold tracking-tighter text-[#a20513] font-headline">Leidenschaft Klub</div>
<div class="hidden md:flex gap-8 items-center">
<a class="text-zinc-600 dark:text-zinc-400 hover:text-[#a20513] transition-colors font-manrope tracking-tight" href="#">Courses</a>
<a class="text-[#a20513] font-bold border-b-2 border-[#a20513] pb-1 font-manrope tracking-tight" href="#">Levels</a>
<a class="text-zinc-600 dark:text-zinc-400 hover:text-[#a20513] transition-colors font-manrope tracking-tight" href="#">About</a>
<a class="text-zinc-600 dark:text-zinc-400 hover:text-[#a20513] transition-colors font-manrope tracking-tight" href="#">Contact</a>
</div>
<div class="flex items-center gap-6">
<span class="material-symbols-outlined text-zinc-600 cursor-pointer hover:opacity-80 transition-opacity">language</span>
<span class="material-symbols-outlined text-zinc-600 cursor-pointer hover:opacity-80 transition-opacity">account_circle</span>
<button class="bg-[#a20513] text-white px-6 py-2 rounded-lg font-bold hover:opacity-80 active:scale-95 duration-200 transition-all">Enroll Now</button>
</div>
</div>
</nav>
<!-- Side Navigation (Sub-navigation for Course Details) -->
<aside class="fixed left-0 top-16 h-[calc(100vh-64px)] hidden lg:flex flex-col py-6 bg-[#fafaf5] dark:bg-zinc-900 w-64 border-r-0 font-inter text-sm">
<div class="px-6 mb-8">
<h3 class="text-[#a20513] font-bold text-xl font-headline tracking-tighter">Level B1</h3>
<p class="text-zinc-500">Intermediate Mastery</p>
</div>
<nav class="flex flex-col gap-1">
<a class="flex items-center gap-3 text-[#a20513] font-semibold border-l-4 border-[#a20513] bg-[#f4f4ef] px-4 py-3 transition-all" href="#overview">
<span class="material-symbols-outlined">info</span> Overview
            </a>
<a class="flex items-center gap-3 text-zinc-500 hover:text-[#a20513] px-4 py-3 hover:bg-[#f4f4ef] transition-all" href="#curriculum">
<span class="material-symbols-outlined">menu_book</span> Curriculum
            </a>
<a class="flex items-center gap-3 text-zinc-500 hover:text-[#a20513] px-4 py-3 hover:bg-[#f4f4ef] transition-all" href="#outcomes">
<span class="material-symbols-outlined">verified_user</span> Outcomes
            </a>
<a class="flex items-center gap-3 text-zinc-500 hover:text-[#a20513] px-4 py-3 hover:bg-[#f4f4ef] transition-all" href="#enroll">
<span class="material-symbols-outlined">app_registration</span> Enrollment
            </a>
</nav>
<div class="mt-auto px-6">
<button class="w-full bg-surface-container-high text-[#a20513] py-3 rounded-xl font-bold hover:bg-[#a20513] hover:text-white transition-all duration-300">
                Book Free Trial
            </button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="lg:ml-64 pt-24 px-6 md:px-12 pb-24 max-w-7xl mx-auto">
<!-- Hero Header -->
<section class="mb-20" id="overview">
<div class="editorial-grid">
<div class="col-span-12 lg:col-span-8">
<span class="text-tertiary font-headline font-bold uppercase tracking-[0.2em] text-sm mb-4 block">Course Level Details</span>
<h1 class="text-6xl md:text-8xl font-headline font-extrabold text-on-surface leading-[0.9] tracking-tighter mb-8">
                        Level B1:<br/><span class="text-primary">Intermediate Mastery</span>
</h1>
<p class="text-xl md:text-2xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
                        Bridge the gap between everyday German and sophisticated discourse. From routine interactions to complex abstract communication, B1 is where your personality finds its German voice.
                    </p>
</div>
<div class="col-span-12 lg:col-span-4 flex flex-col justify-end">
<div class="bg-surface-container-low p-8 rounded-xl space-y-6">
<div class="flex justify-between items-center border-b border-outline-variant/20 pb-4">
<span class="text-zinc-500 font-label uppercase tracking-widest text-xs">Duration</span>
<span class="text-on-surface font-bold">12 Weeks</span>
</div>
<div class="flex justify-between items-center border-b border-outline-variant/20 pb-4">
<span class="text-zinc-500 font-label uppercase tracking-widest text-xs">Intensity</span>
<span class="text-on-surface font-bold">High (6hrs/week)</span>
</div>
<div class="flex justify-between items-center">
<span class="text-zinc-500 font-label uppercase tracking-widest text-xs">Next Cohort</span>
<span class="text-primary font-bold">Sept 15, 2024</span>
</div>
</div>
</div>
</div>
</section>
<!-- Who is this for? -->
<section class="mb-24">
<div class="bg-surface-container-lowest p-10 md:p-16 rounded-xl shadow-sm border border-outline-variant/10">
<div class="flex flex-col md:flex-row gap-12">
<div class="flex-1">
<h2 class="text-3xl font-headline font-bold mb-6">Who is this for?</h2>
<p class="text-on-surface-variant leading-relaxed mb-8">
                            This level is designed for learners who have mastered the basics of German (A2) and are ready to tackle professional and academic environments.
                        </p>
<ul class="space-y-4">
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-1">check_circle</span>
<div>
<span class="font-bold block">Career Climbers</span>
<span class="text-sm text-zinc-500 text-on-surface-variant">Professionals aiming for employment in DACH region companies.</span>
</div>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-1">check_circle</span>
<div>
<span class="font-bold block">Academic Pursuits</span>
<span class="text-sm text-zinc-500 text-on-surface-variant">Students preparing for German university entrance or internships.</span>
</div>
</li>
</ul>
</div>
<div class="w-full md:w-1/3 bg-surface-container-high p-8 rounded-xl flex flex-col justify-center items-center text-center">
<span class="material-symbols-outlined text-5xl text-tertiary mb-4">verified_user</span>
<h4 class="font-bold text-lg mb-2">Prerequisite</h4>
<p class="text-zinc-600 mb-6">Completion of Level A2 or equivalent placement test score.</p>
<a class="text-primary font-bold border-b-2 border-primary/20 hover:border-primary transition-all" href="#">Take Placement Test →</a>
</div>
</div>
</div>
</section>
<!-- Curriculum Highlights (Bento Grid) -->
<section class="mb-24" id="curriculum">
<h2 class="text-4xl font-headline font-extrabold mb-12 tracking-tight">Curriculum Highlights</h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Advanced Grammar -->
<div class="md:col-span-2 bg-on-surface text-surface p-12 rounded-xl flex flex-col justify-between">
<div>
<span class="text-tertiary-fixed-dim font-label uppercase tracking-widest text-xs mb-4 block">Module 01</span>
<h3 class="text-4xl font-headline font-bold mb-4">Advanced Grammar &amp; Logic</h3>
<p class="text-zinc-400 max-w-md">Mastering the Passive Voice, Subjunctive II (Konjunktiv II), and complex relative clauses that define professional German syntax.</p>
</div>
<div class="mt-12 flex flex-wrap gap-3">
<span class="px-4 py-2 bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-tighter">Passive Voice</span>
<span class="px-4 py-2 bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-tighter">Subjunctive II</span>
<span class="px-4 py-2 bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-tighter">Connector Logic</span>
</div>
</div>
<!-- Professional Vocab -->
<div class="bg-surface-container-low p-10 rounded-xl flex flex-col border border-outline-variant/10">
<span class="material-symbols-outlined text-primary text-4xl mb-6">business_center</span>
<h3 class="text-2xl font-headline font-bold mb-4">Professional Vocabulary</h3>
<p class="text-on-surface-variant text-sm leading-relaxed mb-6">Transition from 'restaurant German' to 'boardroom German' with sector-specific terminology.</p>
<div class="mt-auto h-24 w-full bg-surface-container-high rounded-lg flex items-center justify-center border border-dashed border-outline-variant/30">
<span class="text-zinc-400 text-xs font-bold uppercase">Workplace Scenarios</span>
</div>
</div>
<!-- Cultural Nuances -->
<div class="bg-surface-container-low p-10 rounded-xl flex flex-col border border-outline-variant/10">
<span class="material-symbols-outlined text-tertiary text-4xl mb-6">diversity_3</span>
<h3 class="text-2xl font-headline font-bold mb-4">Cultural Nuances</h3>
<p class="text-on-surface-variant text-sm leading-relaxed">Understanding 'Duzen vs. Siezen' in modern contexts and the art of German directness.</p>
</div>
<!-- Oral Fluency -->
<div class="md:col-span-2 bg-primary text-white p-12 rounded-xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
<div class="relative z-10 flex-1">
<h3 class="text-4xl font-headline font-bold mb-4">Oral Fluency &amp; Spontaneity</h3>
<p class="text-white/80">Intensive speaking workshops focused on debating, presenting, and expressing complex emotions without hesitation.</p>
</div>
<div class="w-full md:w-48 h-48 bg-white/10 rounded-full flex-shrink-0 flex items-center justify-center backdrop-blur-sm">
<span class="material-symbols-outlined text-6xl">record_voice_over</span>
</div>
<!-- Decorative circle -->
<div class="absolute -bottom-12 -right-12 w-48 h-48 bg-black/10 rounded-full"></div>
</div>
</div>
</section>
<!-- Gallery / Media -->
<section class="mb-24">
<div class="editorial-grid">
<div class="col-span-12 md:col-span-7 h-[400px] rounded-xl overflow-hidden relative group">
<img alt="B1 German Class in Action" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Modern high-end classroom with students engaged in a lively German language discussion, warm sunlight streaming through large windows, minimalist design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd0QfkWraOeEjJEe0gCbmF8J931mZ8oDURK-V2dom2Y0_18YXw_nRX9LZBC9COJFugUOgKlWjhxVeF1aoWFw_d-nyvjNc_0WZ3F_w7KmjX9SN_78jVdzQIE_GGNiCLnNSoeS8MQA-UvqudVojODlh04xG9x68NwPtEVEcuYpp6VlB__sPa8SDrSCSfSXxs8CRoLCwqN78jW0DL3brppjLr7NNSFBOv6YuEvWNDFAqsImfQQB23QJic3KVuLEerm-bvhYyIl_iQQA"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
<div class="absolute bottom-8 left-8">
<span class="text-white/70 text-xs font-label uppercase tracking-widest">Live Experience</span>
<h4 class="text-white text-2xl font-headline font-bold">Collaborative Learning</h4>
</div>
</div>
<div class="col-span-12 md:col-span-5 flex flex-col justify-center bg-tertiary text-white p-12 rounded-xl">
<h3 class="text-3xl font-headline font-bold mb-6 italic">"B1 was the moment I stopped translating in my head and started feeling the language."</h3>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">SK</div>
<div>
<p class="font-bold">Sarah Koenig</p>
<p class="text-sm text-white/60 text-on-surface-variant">B1 Graduate, Software Engineer</p>
</div>
</div>
</div>
</div>
</section>
<!-- Learning Outcomes -->
<section class="mb-24 py-16 border-y border-outline-variant/20" id="outcomes">
<h2 class="text-4xl font-headline font-extrabold mb-12 text-center tracking-tight">Post-B1 Capabilities</h2>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
<div class="space-y-4">
<span class="text-primary font-bold text-4xl opacity-20">01</span>
<h4 class="font-bold text-lg">Workplace Agility</h4>
<p class="text-sm text-on-surface-variant leading-relaxed">Participate in business meetings and handle professional correspondence with clarity and proper etiquette.</p>
</div>
<div class="space-y-4">
<span class="text-primary font-bold text-4xl opacity-20">02</span>
<h4 class="font-bold text-lg">Textual Analysis</h4>
<p class="text-sm text-on-surface-variant leading-relaxed">Understand the main points of complex technical texts in your field of specialization and standard news reports.</p>
</div>
<div class="space-y-4">
<span class="text-primary font-bold text-4xl opacity-20">03</span>
<h4 class="font-bold text-lg">Abstract Thought</h4>
<p class="text-sm text-on-surface-variant leading-relaxed">Express viewpoints on contemporary issues, giving advantages and disadvantages of various options.</p>
</div>
<div class="space-y-4">
<span class="text-primary font-bold text-4xl opacity-20">04</span>
<h4 class="font-bold text-lg">Social Sophistication</h4>
<p class="text-sm text-on-surface-variant leading-relaxed">Navigate most travel and social situations in German-speaking countries with spontaneous fluency.</p>
</div>
</div>
</section>
<!-- Enrollment Form -->
<section class="editorial-grid mb-24" id="enroll">
<div class="col-span-12 lg:col-span-5">
<h2 class="text-5xl font-headline font-extrabold mb-6 tracking-tighter leading-none">Ready to Master <span class="text-primary">B1?</span></h2>
<p class="text-on-surface-variant mb-8 text-lg">
                    Join our next cohort starting September 15th. Limited to 12 students per class to ensure personalized feedback and rapid progress.
                </p>
<div class="space-y-4">
<div class="flex items-center gap-4 text-on-surface">
<span class="material-symbols-outlined text-primary">verified</span>
<span>Official Certification Preparation</span>
</div>
<div class="flex items-center gap-4 text-on-surface">
<span class="material-symbols-outlined text-primary">groups</span>
<span>Peer-to-Peer Learning Groups</span>
</div>
<div class="flex items-center gap-4 text-on-surface">
<span class="material-symbols-outlined text-primary">schedule</span>
<span>Flexible Evening &amp; Weekend Slots</span>
</div>
</div>
</div>
<div class="col-span-12 lg:col-span-7">
<div class="bg-surface-container-low p-8 md:p-12 rounded-xl shadow-lg shadow-black/5">
<form class="space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="text-xs font-bold uppercase tracking-widest text-zinc-500 font-label">Full Name</label>
<input class="w-full bg-surface-container-lowest border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Wolfgang Amadeus" type="text"/>
</div>
<div class="space-y-2">
<label class="text-xs font-bold uppercase tracking-widest text-zinc-500 font-label">Email Address</label>
<input class="w-full bg-surface-container-lowest border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="wolfgang@vienna.at" type="email"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="text-xs font-bold uppercase tracking-widest text-zinc-500 font-label">Phone Number</label>
<input class="w-full bg-surface-container-lowest border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="+49 123 456 789" type="tel"/>
</div>
<div class="space-y-2">
<label class="text-xs font-bold uppercase tracking-widest text-zinc-500 font-label">Current Level</label>
<select class="w-full bg-surface-container-lowest border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
<option>Completed A2</option>
<option>Intermediate (Self-taught)</option>
<option>Restoring old skills</option>
<option>Other</option>
</select>
</div>
</div>
<div class="space-y-2">
<label class="text-xs font-bold uppercase tracking-widest text-zinc-500 font-label">Message (Optional)</label>
<textarea class="w-full bg-surface-container-lowest border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Tell us about your learning goals..." rows="4"></textarea>
</div>
<button class="w-full bg-gradient-to-r from-primary to-primary-container text-white py-5 rounded-xl font-headline font-bold text-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20" type="submit">
                            Request Enrollment
                        </button>
</form>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full bg-[#f4f4ef] dark:bg-zinc-950 no-border tonal-shift">
<div class="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
<div class="flex items-center gap-4">
<span class="text-[#a20513] font-black font-headline text-xl">Leidenschaft Klub.</span>
<span class="text-zinc-400 hidden md:block">|</span>
<p class="font-inter text-xs uppercase tracking-widest text-zinc-500">© 2024 Leidenschaft Klub. German Precision. Cultural Warmth.</p>
</div>
<div class="flex gap-8">
<a class="font-inter text-xs uppercase tracking-widest text-zinc-500 hover:text-[#a20513] transition-colors" href="#">Privacy Policy</a>
<a class="font-inter text-xs uppercase tracking-widest text-zinc-500 hover:text-[#a20513] transition-colors" href="#">Terms of Service</a>
<a class="font-inter text-xs uppercase tracking-widest text-zinc-500 hover:text-[#a20513] transition-colors" href="#">Imprint</a>
</div>
</div>
</footer>
<!-- FAB for quick action (only on Mobile as per relevance) -->
<div class="md:hidden fixed bottom-6 right-6 z-50">
<button class="bg-primary text-white p-4 rounded-full shadow-2xl flex items-center justify-center">
<span class="material-symbols-outlined">app_registration</span>
</button>
</div>
</body></html>