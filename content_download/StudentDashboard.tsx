<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Leidenschaft Klub | Student Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "on-secondary-fixed": "#1c1b1b",
                        "on-secondary-fixed-variant": "#474746",
                        "on-primary-fixed": "#410003",
                        "on-tertiary-fixed": "#2c1600",
                        "surface-tint": "#b91d20",
                        "error-container": "#ffdad6",
                        "primary-container": "#c62828",
                        "surface-dim": "#dadad5",
                        "outline-variant": "#e4beba",
                        "secondary-container": "#e2dfde",
                        "inverse-on-surface": "#f1f1ec",
                        "on-tertiary": "#ffffff",
                        "surface-container-low": "#f4f4ef",
                        "surface": "#fafaf5",
                        "on-secondary-container": "#636262",
                        "error": "#ba1a1a",
                        "on-primary-fixed-variant": "#93000e",
                        "on-error-container": "#93000a",
                        "secondary-fixed-dim": "#c8c6c5",
                        "on-secondary": "#ffffff",
                        "surface-variant": "#e3e3de",
                        "tertiary-fixed-dim": "#f0bd8b",
                        "surface-container": "#eeeee9",
                        "surface-bright": "#fafaf5",
                        "inverse-primary": "#ffb4ac",
                        "primary-fixed": "#ffdad6",
                        "surface-container-lowest": "#ffffff",
                        "tertiary-container": "#885f35",
                        "primary-fixed-dim": "#ffb4ac",
                        "tertiary-fixed": "#ffdcbd",
                        "on-surface-variant": "#5b403d",
                        "surface-container-high": "#e8e8e3",
                        "outline": "#8f706c",
                        "tertiary": "#6c4820",
                        "on-surface": "#1a1c19",
                        "background": "#fafaf5",
                        "on-primary-container": "#ffe0dd",
                        "secondary": "#5f5e5e",
                        "primary": "#a20513",
                        "secondary-fixed": "#e5e2e1",
                        "on-tertiary-fixed-variant": "#623f18",
                        "on-primary": "#ffffff",
                        "surface-container-highest": "#e3e3de",
                        "on-tertiary-container": "#ffe2c9",
                        "inverse-surface": "#2f312e",
                        "on-error": "#ffffff",
                        "on-background": "#1a1c19"
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
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar (Shared Component) -->
<aside class="h-screen w-64 fixed left-0 top-0 bg-[#fafaf5]/90 dark:bg-slate-900/90 backdrop-blur-2xl flex flex-col h-full py-8 border-r-0 shadow-[32px_0_32px_rgba(26,28,25,0.06)] z-50">
<div class="px-8 mb-10">
<span class="text-lg font-black text-[#a20513] tracking-tighter">Leidenschaft Klub</span>
</div>
<div class="px-6 mb-8">
<div class="flex items-center gap-3 mb-4">
<img alt="Student Profile Picture" class="w-10 h-10 rounded-full object-cover" data-alt="Professional portrait of a young man with glasses and a friendly expression in a bright modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0WeJP85c4XlBWH_aWyXDetVOEfgCovAKjCXReUAT8ED4bYzCZWCmt44x-niPJvHBCQ0CD7ExByelwScWAb4pzUUra0PpyB3jbeY9v91gA1QfoHcIh_Zs4OxTqvEhB4hIxl3OXYBo08M69NvnOv-rTFJ1j9aMLywvzoIGnfzvpxknYW7mY1BxYZ0YGkJxAEruK9F8DyQDBE_qPsbGCO5n5rQj72srXFkrNB9H1DksjafKsHsgVCP6mnZrQ3llF5oXWB30t59D1xQ"/>
<div>
<p class="font-['Inter'] text-sm font-semibold text-on-surface">Wilhelm Schmidt</p>
<p class="text-xs text-slate-500">Level B2 - German</p>
</div>
</div>
</div>
<nav class="flex-1 flex flex-col gap-1">
<!-- Active State: Dashboard -->
<a class="flex items-center gap-3 px-6 py-3 text-[#a20513] bg-[#f4f4ef] dark:bg-slate-800 border-l-[3px] border-[#a20513] font-['Inter'] text-sm font-semibold transition-all translate-x-1 duration-200" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-[#a20513] hover:bg-[#f4f4ef] font-['Inter'] text-sm font-semibold transition-all" href="#">
<span class="material-symbols-outlined" data-icon="school">school</span>
<span>My Courses</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-[#a20513] hover:bg-[#f4f4ef] font-['Inter'] text-sm font-semibold transition-all" href="#">
<span class="material-symbols-outlined" data-icon="assignment">assignment</span>
<span>Assignments</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-[#a20513] hover:bg-[#f4f4ef] font-['Inter'] text-sm font-semibold transition-all" href="#">
<span class="material-symbols-outlined" data-icon="quiz">quiz</span>
<span>Quizzes</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-[#a20513] hover:bg-[#f4f4ef] font-['Inter'] text-sm font-semibold transition-all" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
<span>Messages</span>
</a>
</nav>
<div class="px-6 mt-auto flex flex-col gap-1">
<button class="mb-6 w-full py-3 bg-gradient-to-br from-[#a20513] to-[#c62828] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 scale-95 active:scale-90 transition-transform">
                Upgrade Plan
            </button>
<a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-[#a20513] font-['Inter'] text-xs uppercase tracking-widest transition-all" href="#">
<span class="material-symbols-outlined text-sm" data-icon="settings">settings</span>
<span>Settings</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-[#a20513] font-['Inter'] text-xs uppercase tracking-widest transition-all" href="#">
<span class="material-symbols-outlined text-sm" data-icon="logout">logout</span>
<span>Logout</span>
</a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="ml-64 min-h-screen p-12">
<!-- Header Section -->
<header class="mb-12 flex justify-between items-end">
<div class="max-w-2xl">
<h1 class="text-5xl font-extrabold tracking-tighter text-on-surface mb-2">Guten Tag, Wilhelm.</h1>
<p class="text-lg text-secondary font-medium">Your linguistic precision is improving. You've completed 75% of Level B2.</p>
</div>
<div class="hidden lg:flex items-center gap-4 bg-surface-container-low p-2 rounded-full pr-6 shadow-sm">
<div class="bg-primary p-2 rounded-full text-white flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="trending_up">trending_up</span>
</div>
<span class="text-sm font-bold tracking-tight">Top 5% of Students this week</span>
</div>
</header>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-12 gap-8">
<!-- Progress Overview Card -->
<section class="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden group">
<div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
<div class="flex justify-between items-start mb-10 relative z-10">
<div>
<h2 class="text-2xl font-bold mb-1">Current Progress</h2>
<span class="text-tertiary font-semibold text-sm">German Mastery: Level B2</span>
</div>
<div class="text-right">
<span class="text-4xl font-black text-primary">75%</span>
<p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Completion Rate</p>
</div>
</div>
<div class="relative w-full h-3 bg-secondary-container rounded-full mb-8 overflow-hidden">
<div class="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style="width: 75%"></div>
</div>
<div class="grid grid-cols-3 gap-6 relative z-10">
<div class="bg-surface-container-low p-4 rounded-xl">
<p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Next Milestone</p>
<p class="text-sm font-bold">Complex Syntax Exam</p>
</div>
<div class="bg-surface-container-low p-4 rounded-xl">
<p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Time Invested</p>
<p class="text-sm font-bold">142 Hours</p>
</div>
<div class="bg-surface-container-low p-4 rounded-xl border-l-2 border-primary">
<p class="text-xs font-bold text-primary uppercase tracking-widest mb-1">Vocabulary</p>
<p class="text-sm font-bold">3,420 Words</p>
</div>
</div>
</section>
<!-- Quick Quiz Links -->
<section class="col-span-12 lg:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col">
<h2 class="text-xl font-bold mb-6 flex items-center gap-2">
<span class="material-symbols-outlined text-primary" data-icon="timer">timer</span>
                    Upcoming Quizzes
                </h2>
<div class="flex flex-col gap-4 flex-1">
<div class="bg-surface-container-lowest p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-all">
<div>
<p class="font-bold text-sm">Passive Voice</p>
<p class="text-xs text-slate-500">Starts in 2 hours</p>
</div>
<span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</div>
<div class="bg-surface-container-lowest p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-all">
<div>
<p class="font-bold text-sm">Relative Clauses</p>
<p class="text-xs text-slate-500">Due tomorrow</p>
</div>
<span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</div>
</div>
<button class="mt-6 w-full py-3 border-2 border-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors">
                    View All Quizzes
                </button>
</section>
<!-- Active Course Details -->
<section class="col-span-12 lg:col-span-7 space-y-8">
<div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
<div class="flex items-center justify-between mb-8">
<h2 class="text-2xl font-bold tracking-tight">Active Level: B2 German</h2>
<span class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">In Progress</span>
</div>
<div class="space-y-6">
<div class="flex gap-6 items-start">
<div class="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="play_circle">play_circle</span>
</div>
<div class="flex-1">
<h3 class="font-bold mb-1">Lesson 14: Subjunctive II in Business</h3>
<p class="text-sm text-secondary mb-3">Mastering formal hypothetical requests in German workplace culture.</p>
<div class="flex gap-3">
<button class="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
<span class="material-symbols-outlined text-base" data-icon="video_library">video_library</span>
                                        Watch Video
                                    </button>
<button class="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
<span class="material-symbols-outlined text-base" data-icon="description">description</span>
                                        Grammar PDF
                                    </button>
</div>
</div>
</div>
<div class="flex gap-6 items-start opacity-50">
<div class="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="lock">lock</span>
</div>
<div class="flex-1">
<h3 class="font-bold mb-1">Lesson 15: Idiomatic Expressions</h3>
<p class="text-sm text-secondary">Advanced colloquialisms and regional dialects.</p>
</div>
</div>
</div>
</div>
<!-- Learning Materials Overlap Concept -->
<div class="relative">
<div class="bg-tertiary text-white p-8 rounded-xl flex items-center gap-8 shadow-xl">
<div class="w-24 h-24 shrink-0 rounded-lg overflow-hidden rotate-3 shadow-2xl">
<img alt="German Textbook" class="w-full h-full object-cover" data-alt="Modern minimalist book cover with abstract shapes and German typography in warm earth tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKMhvj5EHvFCbFSwOfkPCGdXhVwxcImve8iLQfw9SFSybw4aqHEwEmLK1sA5Ucm-Sqn3AYUHKt7ji4EnO5NJA-dTeHcQgX96F6HUB_R_sT1NNNuWDRewbZlASShep7jGtgaC3AWUAQS_nuDY5uFAOUmS5qfzKpYHmstan4LrPVTOBz775q8JetGsDXOCGNMtPIkvnucLXB8bZWnjjcIcIAi9lT9dZQCfl4kc8euO7DGD6C60qCCBiCnmBAQz_ijIrwBUUgSwRoQg"/>
</div>
<div>
<h3 class="text-xl font-bold mb-2">New Material Released</h3>
<p class="text-sm opacity-80 mb-4">"The Precision Guide to Dative Prepositions" has been added to your library.</p>
<button class="bg-white text-tertiary px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                                Download Now
                            </button>
</div>
</div>
</div>
</section>
<!-- Assignments Side Panel -->
<section class="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-xl shadow-sm border-t-4 border-primary">
<div class="flex justify-between items-center mb-8">
<h2 class="text-xl font-bold">Admin Assignments</h2>
<span class="text-xs font-bold text-slate-400">3 Pending</span>
</div>
<div class="space-y-4">
<div class="p-5 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-primary/10">
<div class="flex justify-between mb-2">
<span class="text-[10px] font-bold text-primary uppercase tracking-widest">High Priority</span>
<span class="text-[10px] font-bold text-slate-400">Due Today</span>
</div>
<h4 class="font-bold text-sm mb-1">Essay: Cultural Impact of the Bauhaus</h4>
<p class="text-xs text-secondary leading-relaxed">Submit a 500-word analysis using at least 5 B2-level conjunctions.</p>
</div>
<div class="p-5 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-primary/10">
<div class="flex justify-between mb-2">
<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Speaking Task</span>
<span class="text-[10px] font-bold text-slate-400">Due Friday</span>
</div>
<h4 class="font-bold text-sm mb-1">Audio Recording: Mock Interview</h4>
<p class="text-xs text-secondary leading-relaxed">Record a 3-minute professional introduction as if for a German firm.</p>
</div>
<div class="p-5 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-primary/10 opacity-70">
<div class="flex justify-between mb-2">
<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Review</span>
<span class="text-[10px] font-bold text-slate-400">Due Nov 12</span>
</div>
<h4 class="font-bold text-sm mb-1">Peer Feedback: Vocabulary Quiz</h4>
<p class="text-xs text-secondary leading-relaxed">Review the quiz attempts from your study group and leave 2 comments.</p>
</div>
</div>
</section>
</div>
<!-- Footer (Shared Component inspired) -->
<footer class="mt-20 pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-surface-container-high">
<div class="text-center md:text-left">
<span class="font-['Manrope'] font-black text-[#a20513] mb-2 block">Leidenschaft Klub</span>
<p class="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-400">© 2024 Leidenschaft Klub. Precision in Language.</p>
</div>
<div class="flex gap-8">
<a class="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-500 hover:text-[#a20513] transition-colors" href="#">Privacy Policy</a>
<a class="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-500 hover:text-[#a20513] transition-colors" href="#">Terms of Service</a>
<a class="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-500 hover:text-[#a20513] transition-colors" href="#">Help Center</a>
</div>
</footer>
</main>
</body></html>