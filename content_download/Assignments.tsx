<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Assignments | Leidenschaft Klub</title>
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
                        "surface-container": "#eeeee9",
                        "primary-fixed-dim": "#ffb4ac",
                        "on-background": "#1a1c19",
                        "outline-variant": "#e4beba",
                        "outline": "#8f706c",
                        "on-primary-fixed-variant": "#93000e",
                        "surface-container-low": "#f4f4ef",
                        "tertiary-fixed-dim": "#f0bd8b",
                        "secondary-fixed-dim": "#c8c6c5",
                        "on-error": "#ffffff",
                        "surface-container-highest": "#e3e3de",
                        "on-secondary-fixed-variant": "#474746",
                        "on-primary-fixed": "#410003",
                        "inverse-on-surface": "#f1f1ec",
                        "tertiary-container": "#885f35",
                        "surface-dim": "#dadad5",
                        "background": "#fafaf5",
                        "primary-container": "#c62828",
                        "on-tertiary-container": "#ffe2c9",
                        "secondary": "#5f5e5e",
                        "on-tertiary-fixed": "#2c1600",
                        "surface": "#fafaf5",
                        "on-secondary-container": "#636262",
                        "secondary-fixed": "#e5e2e1",
                        "on-primary-container": "#ffe0dd",
                        "primary-fixed": "#ffdad6",
                        "inverse-primary": "#ffb4ac",
                        "surface-variant": "#e3e3de",
                        "surface-tint": "#b91d20",
                        "primary": "#a20513",
                        "surface-container-high": "#e8e8e3",
                        "surface-bright": "#fafaf5",
                        "error-container": "#ffdad6",
                        "tertiary": "#6c4820",
                        "on-surface-variant": "#5b403d",
                        "error": "#ba1a1a",
                        "surface-container-lowest": "#ffffff",
                        "on-tertiary-fixed-variant": "#623f18",
                        "on-secondary-fixed": "#1c1b1b",
                        "on-surface": "#1a1c19",
                        "on-secondary": "#ffffff",
                        "inverse-surface": "#2f312e",
                        "on-tertiary": "#ffffff",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "tertiary-fixed": "#ffdcbd",
                        "secondary-container": "#e2dfde"
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
        .glass-sidebar {
            background: rgba(250, 250, 245, 0.8);
            backdrop-filter: blur(20px);
        }
    </style>
</head>
<body class="bg-background font-body text-on-surface">
<!-- SideNavBar Component -->
<aside class="h-screen w-72 fixed left-0 top-0 bg-[#fafaf5]/80 backdrop-blur-xl flex flex-col py-8 space-y-2 z-50 overflow-y-auto">
<div class="px-8 mb-10">
<h1 class="font-['Manrope'] font-black text-[#a20513] text-xl">Leidenschaft Klub</h1>
<p class="text-xs font-label uppercase tracking-widest text-secondary mt-1">Student Portal</p>
</div>
<nav class="flex-grow">
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="font-['Inter'] font-medium text-sm">Dashboard</span>
</a>
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="school">school</span>
<span class="font-['Inter'] font-medium text-sm">My Courses</span>
</a>
<!-- Active Tab: Assignments -->
<a class="border-l-4 border-[#a20513] bg-[#f4f4ef] text-[#1a1c19] font-bold px-6 py-3 flex items-center gap-3 transition-all scale-95" href="#">
<span class="material-symbols-outlined text-primary" data-icon="assignment">assignment</span>
<span class="font-['Inter'] font-medium text-sm">Assignments</span>
</a>
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
<span class="font-['Inter'] font-medium text-sm">Messages</span>
</a>
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-['Inter'] font-medium text-sm">Settings</span>
</a>
</nav>
<div class="px-6 py-4">
<button class="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all">
                Upgrade Plan
            </button>
</div>
<div class="mt-auto border-t border-stone-200/50 pt-4">
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span class="font-['Inter'] font-medium text-sm">Help Center</span>
</a>
<a class="text-stone-500 px-6 py-3 hover:bg-stone-100 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1 group" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span class="font-['Inter'] font-medium text-sm">Logout</span>
</a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="ml-72 min-h-screen p-8 lg:p-12">
<header class="mb-12 flex justify-between items-end">
<div>
<h2 class="font-headline font-extrabold text-4xl tracking-tighter text-on-surface">Curated Tasks</h2>
<p class="text-tertiary mt-2 font-label uppercase text-xs tracking-[0.2em]">Precision in Learning &amp; Excellence</p>
</div>
<div class="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl">
<div class="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
<img class="w-full h-full object-cover" data-alt="close-up portrait of a professional male student in a minimal beige studio setting with soft natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRaqLxsix3HM0YAvacTeb04SQ55hjSszwY77E5TiPpDSQ0kpMhc_al71CoL5v3TITOyU9TBDy0duXSHVTsC3xQt6BGSvCbioY9un3h11YJSed37Cp2iIRQZBbqIDUaq_mMdV6jvkEDMcG5CkaqmR4_pCpU_bCWQtF9DGGJt2AUj8Cr4hNOHFu3su3Axt6XUIMEeTQLmfGJqkr1-n5lPBfqy-EHnYH8fLl39BbYsVJpOfJksVbJCp3yF514MtvVppvVVwHFIc4JEg"/>
</div>
<div class="pr-4">
<p class="text-sm font-bold text-on-surface leading-none">Lukas Weber</p>
<p class="text-[10px] text-stone-500 uppercase tracking-widest font-bold">B2 Advanced German</p>
</div>
</div>
</header>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-12 gap-6">
<!-- Left Column: Assignment List -->
<div class="col-span-12 lg:col-span-4 space-y-6">
<div class="flex items-center justify-between mb-2">
<h3 class="font-headline font-bold text-lg">My Assignments</h3>
<span class="text-xs bg-surface-container-high px-2 py-1 rounded text-stone-600 font-bold uppercase">8 Total</span>
</div>
<!-- Assignment Card: Pending -->
<div class="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary shadow-[0_8px_32px_rgba(26,28,25,0.04)] hover:translate-y-[-2px] transition-transform duration-300">
<div class="flex justify-between items-start mb-4">
<span class="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-container/10 px-2 py-1 rounded">Pending</span>
<p class="text-xs text-stone-400 font-medium">Due in 2 days</p>
</div>
<h4 class="font-bold text-on-surface mb-2">Advanced German Syntax: The Passive Voice</h4>
<p class="text-sm text-stone-500 line-clamp-2 mb-4">Deep dive into formal structures used in academic and legal German documentation.</p>
<div class="flex items-center gap-2 text-tertiary">
<span class="material-symbols-outlined text-sm" data-icon="schedule">schedule</span>
<span class="text-xs font-bold">45 mins estimated</span>
</div>
</div>
<!-- Assignment Card: Submitted -->
<div class="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer">
<div class="flex justify-between items-start mb-4">
<span class="text-[10px] font-bold uppercase tracking-widest text-stone-600 bg-surface-container-high px-2 py-1 rounded">Submitted</span>
<p class="text-xs text-stone-400 font-medium">Oct 12, 2024</p>
</div>
<h4 class="font-bold text-on-surface mb-2">Cultural Nuances in Business Etiquette</h4>
<p class="text-sm text-stone-500 line-clamp-2 mb-4">Essay exploring the differences between DACH region business communications.</p>
<div class="flex items-center gap-2 text-stone-400">
<span class="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
<span class="text-xs font-bold">Awaiting Grade</span>
</div>
</div>
<!-- Assignment Card: Graded -->
<div class="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer">
<div class="flex justify-between items-start mb-4">
<span class="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 rounded">Graded</span>
<p class="text-xs text-stone-400 font-medium">Oct 05, 2024</p>
</div>
<div class="flex justify-between items-center mb-2">
<h4 class="font-bold text-on-surface">Idiomatic Expressions in Berlin</h4>
<span class="text-lg font-black text-primary">94%</span>
</div>
<p class="text-sm text-stone-500 line-clamp-2 mb-4">Mastering the 'Berliner Schnauze' through audio comprehension.</p>
</div>
</div>
<!-- Right Column: Focused Assignment View -->
<div class="col-span-12 lg:col-span-8">
<div class="bg-surface-container-lowest rounded-xl p-8 lg:p-12 shadow-[0_32px_64px_rgba(26,28,25,0.06)] sticky top-8">
<div class="flex items-center gap-3 mb-8">
<div class="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-3xl" data-icon="edit_note">edit_note</span>
</div>
<div>
<p class="text-[10px] text-tertiary font-bold uppercase tracking-[0.2em]">Assignment Workspace</p>
<h3 class="font-headline font-bold text-2xl">Advanced German Syntax: The Passive Voice</h3>
</div>
</div>
<!-- Instructions -->
<section class="mb-10">
<h4 class="font-bold text-sm uppercase tracking-widest text-stone-400 mb-4">Task Instructions</h4>
<div class="text-on-surface leading-relaxed space-y-4">
<p>For this assignment, you must rewrite the provided legal paragraph using formal passive voice structures (*Passiv mit Modalverben*). Ensure the tone remains objective and professional.</p>
<div class="bg-surface-container-low p-6 rounded-xl border-l-2 border-stone-300 italic text-stone-600 text-sm">
                                "Die Regierung muss das Gesetz bis zum Ende des Jahres verabschieden. Man kann die Reformen nicht länger aufschieben."
                            </div>
</div>
</section>
<!-- Submission Portal -->
<section class="space-y-8">
<div>
<label class="block font-bold text-sm uppercase tracking-widest text-stone-400 mb-4">Your Written Response</label>
<textarea class="w-full bg-surface-container-low border-none rounded-xl p-6 text-on-surface placeholder:text-stone-400 focus:ring-2 focus:ring-primary/20 transition-all font-body resize-none" placeholder="Type your translation or response here..." rows="6"></textarea>
</div>
<div>
<label class="block font-bold text-sm uppercase tracking-widest text-stone-400 mb-4">Supporting Documents (Optional)</label>
<div class="border-2 border-dashed border-stone-200 rounded-xl p-10 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
<span class="material-symbols-outlined text-4xl text-stone-300 group-hover:text-primary transition-colors mb-2" data-icon="cloud_upload">cloud_upload</span>
<p class="text-sm font-bold text-on-surface">Drag and drop files or <span class="text-primary">browse</span></p>
<p class="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">PDF, DOCX up to 10MB</p>
</div>
</div>
<div class="flex items-center justify-between pt-4">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span class="text-xs font-medium text-stone-500 italic">Progress auto-saved at 14:42</span>
</div>
<div class="flex gap-4">
<button class="px-8 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">
                                    Save Draft
                                </button>
<button class="px-10 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
                                    Submit Assignment
                                </button>
</div>
</div>
</section>
</div>
</div>
</div>
<!-- Course Summary Overlay (Editorial Element) -->
<div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
<div class="relative overflow-hidden rounded-xl h-48 group">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="a minimal workspace with a closed leather journal, fountain pen, and a cup of black coffee on a warm wood surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6ynV9NxIfOo1nx9lBYUfDc74KCuSm95ZP5YTr63pHTtY4NNJ7Ov0GjFudgAbMLkqE9gXMXgy4hFUFpHFQKpMdBrauKuCkhvDBEkeIYkVQTbG3xcCv9zKRMqcI_EFZNMPOMuyKwHu-lUOGKSBUhIwFnvhJtqft6TpdeLL7q1QZDRUa0N0laF564_taTLMQ3MNSYN2CX4hCZHrJrbUt8vCtT2c3cyWHQ_F000yGeMtZSzdD1bfZ2jPqPC0pqdzt5GfRno9wwyq7uA"/>
<div class="absolute inset-0 bg-stone-900/40 p-6 flex flex-col justify-end">
<p class="text-white font-bold text-lg">Curated Grammar Guide</p>
<p class="text-white/70 text-xs">PDF Reference included</p>
</div>
</div>
<div class="bg-tertiary-fixed rounded-xl p-8 flex flex-col justify-between">
<div>
<span class="material-symbols-outlined text-on-tertiary-fixed-variant text-3xl mb-4" data-icon="auto_awesome">auto_awesome</span>
<h4 class="font-headline font-bold text-xl text-on-tertiary-fixed leading-tight">Mastering Fluency</h4>
</div>
<p class="text-on-tertiary-fixed-variant text-sm font-medium">Your syntax assignments contribute 15% to your overall B2 certification.</p>
</div>
<div class="bg-surface-container p-8 rounded-xl flex items-center gap-6">
<div class="flex-grow">
<h4 class="font-headline font-bold text-on-surface">Weekly Progress</h4>
<div class="mt-4 h-2 bg-surface-container-high rounded-full overflow-hidden">
<div class="h-full bg-primary w-[78%]"></div>
</div>
<div class="flex justify-between mt-2">
<span class="text-[10px] font-bold uppercase text-tertiary">Current Tier</span>
<span class="text-[10px] font-bold uppercase text-primary">78%</span>
</div>
</div>
</div>
</div>
</main>
<!-- Footer Component -->
<footer class="ml-72 border-t border-stone-200/15 bg-surface-container-low py-12 px-8">
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-screen-2xl mx-auto">
<div>
<span class="font-['Manrope'] font-bold text-stone-900 text-lg">Leidenschaft Klub</span>
<p class="font-['Inter'] text-xs uppercase tracking-widest text-stone-500 mt-2">© 2024 Leidenschaft Klub. Precision in Learning.</p>
</div>
<div class="flex gap-8 justify-end">
<a class="font-['Inter'] text-xs uppercase tracking-widest text-stone-500 hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a class="font-['Inter'] text-xs uppercase tracking-widest text-stone-500 hover:text-primary transition-colors" href="#">Terms of Service</a>
<a class="font-['Inter'] text-xs uppercase tracking-widest text-stone-500 hover:text-primary transition-colors" href="#">Contact Us</a>
<a class="font-['Inter'] text-xs uppercase tracking-widest text-stone-500 hover:text-primary transition-colors" href="#">Careers</a>
</div>
</div>
</footer>
</body></html>