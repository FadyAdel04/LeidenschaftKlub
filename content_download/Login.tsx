<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Login | Leidenschaft Klub</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
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
      .editorial-shadow {
        box-shadow: 0 32px 64px -12px rgba(26, 28, 25, 0.06);
      }
      .brand-gradient {
        background: linear-gradient(135deg, #a20513 0%, #c62828 100%);
      }
    </style>
</head>
<body class="bg-surface font-body text-on-surface antialiased">
<main class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
<!-- Left Side: Editorial Content/Brand Image -->
<section class="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-surface-container-low">
<!-- Branding Overlay -->
<div class="relative z-10">
<h1 class="font-headline font-black text-3xl tracking-tighter text-primary">
                    Leidenschaft Klub
                </h1>
<p class="mt-4 font-body text-secondary max-w-sm leading-relaxed">
                    Precision in language. Passion in culture. Join our elite community of German language enthusiasts.
                </p>
</div>
<!-- Main Image Frame -->
<div class="relative z-10 mt-12 mb-auto group">
<div class="aspect-[4/5] rounded-xl overflow-hidden editorial-shadow bg-surface-container">
<img alt="Sophisticated interior" class="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-700" data-alt="Editorial close-up of a premium minimalist study in Berlin with a Bauhaus desk, warm lighting, and classic German literature" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY7kqf4nM4BiUskZQaQ-8b9S3EisaSpLxqwLw_4fKcEDNhYlssfmobmKzz-0AMCteMbKeTVvaQBqwmMRDaUWwK_OD8xxOH6vXZN9_xuNUR8DJo_hnW_AXZWGXk2_LAOlu-8x9ENnvYXcXheXYue1LgQdEa86eKWSUCjcEjOidg4ZixdI5zkC6xBF4yYfX4il-eKbThh-Jk3f6nxRdxGd_XFIRTjBGx6Owb2boj0T5FHRdfw2971gGoqGsij24SzhcV30u95GLhlw"/>
</div>
<!-- Floating Detail Card -->
<div class="absolute -bottom-6 -right-6 bg-surface-container-lowest p-6 rounded-xl editorial-shadow max-w-xs">
<span class="font-headline font-extrabold text-primary text-4xl block mb-2">B2+</span>
<p class="text-xs font-label uppercase tracking-widest text-tertiary">Advanced Mastery Track</p>
</div>
</div>
<!-- Footer Text -->
<div class="relative z-10 pt-12">
<p class="font-label text-[10px] uppercase tracking-[0.2em] text-on-secondary-fixed-variant">
                    © 2024 Leidenschaft Klub. All rights reserved.
                </p>
</div>
<!-- Background Aesthetic Element -->
<div class="absolute top-0 right-0 w-1/2 h-full bg-surface opacity-50 -skew-x-12 translate-x-24"></div>
</section>
<!-- Right Side: Login Form -->
<section class="flex flex-col justify-center items-center px-6 md:px-12 lg:px-24 bg-surface">
<div class="w-full max-w-md">
<!-- Mobile Branding (Hidden on Desktop) -->
<div class="lg:hidden mb-12 text-center">
<h1 class="font-headline font-black text-4xl tracking-tighter text-primary">LK.</h1>
</div>
<header class="mb-10">
<h2 class="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-none mb-4">
                        Willkommen.
                    </h2>
<p class="text-secondary font-medium">Please enter your credentials to access the klub.</p>
</header>
<form class="space-y-6">
<!-- Email Field -->
<div class="space-y-2">
<label class="block font-label text-xs uppercase tracking-widest font-semibold text-on-secondary-fixed-variant ml-1" for="email">
                            Email Address
                        </label>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-lg">
                                mail
                            </span>
<input class="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body text-on-surface placeholder:text-secondary/50" id="email" placeholder="name@example.com" type="email"/>
</div>
</div>
<!-- Password Field -->
<div class="space-y-2">
<div class="flex justify-between items-end px-1">
<label class="block font-label text-xs uppercase tracking-widest font-semibold text-on-secondary-fixed-variant" for="password">
                                Password
                            </label>
<a class="text-xs font-medium text-tertiary hover:text-primary transition-colors" href="#">
                                Forgot Password?
                            </a>
</div>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-lg">
                                lock
                            </span>
<input class="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body text-on-surface placeholder:text-secondary/50" id="password" placeholder="••••••••" type="password"/>
</div>
</div>
<!-- Remember Me (Optional Contextual Add) -->
<div class="flex items-center space-x-3 px-1">
<input class="w-5 h-5 rounded border-none bg-surface-container-high text-primary focus:ring-primary/20" id="remember" type="checkbox"/>
<label class="text-sm font-medium text-secondary select-none" for="remember">Keep me signed in</label>
</div>
<!-- CTA Button -->
<div class="pt-4">
<button class="w-full brand-gradient text-on-primary font-headline font-extrabold py-5 rounded-xl editorial-shadow hover:opacity-95 active:scale-[0.98] transition-all tracking-tight text-lg" type="submit">
                            Login
                        </button>
</div>
</form>
<!-- Footer Links -->
<footer class="mt-12 text-center">
<p class="text-secondary font-medium">
                        New to the Klub? 
                        <a class="text-primary font-bold border-b-2 border-primary/10 hover:border-primary transition-all ml-1" href="#">
                            Register
                        </a>
</p>
</footer>
</div>
<!-- Global Nav Suppression logic: This is a focused transactional screen, so no Global Nav is rendered -->
</section>
</main>
<!-- Bottom Footer (Minimalist/Legal) -->
<footer class="fixed bottom-8 right-8 hidden lg:block">
<div class="flex space-x-6">
<a class="font-label text-[10px] uppercase tracking-widest text-secondary hover:text-primary transition-colors" href="#">Imprint</a>
<a class="font-label text-[10px] uppercase tracking-widest text-secondary hover:text-primary transition-colors" href="#">Privacy</a>
<a class="font-label text-[10px] uppercase tracking-widest text-secondary hover:text-primary transition-colors" href="#">Support</a>
</div>
</footer>
</body></html>