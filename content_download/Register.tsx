<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&amp;family=Inter:wght@100..900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-container-highest": "#e3e3de",
              "primary": "#a20513",
              "secondary-fixed-dim": "#c8c6c5",
              "on-tertiary-fixed": "#2c1600",
              "on-secondary-container": "#636262",
              "surface-container-high": "#e8e8e3",
              "secondary-container": "#e2dfde",
              "surface": "#fafaf5",
              "on-error-container": "#93000a",
              "on-primary-fixed": "#410003",
              "on-primary-container": "#ffe0dd",
              "surface-dim": "#dadad5",
              "on-tertiary-container": "#ffe2c9",
              "on-primary-fixed-variant": "#93000e",
              "surface-container-lowest": "#ffffff",
              "on-secondary-fixed": "#1c1b1b",
              "error-container": "#ffdad6",
              "primary-fixed": "#ffdad6",
              "on-surface-variant": "#5b403d",
              "on-tertiary": "#ffffff",
              "inverse-primary": "#ffb4ac",
              "tertiary-fixed-dim": "#f0bd8b",
              "tertiary-fixed": "#ffdcbd",
              "on-error": "#ffffff",
              "inverse-surface": "#2f312e",
              "surface-bright": "#fafaf5",
              "on-background": "#1a1c19",
              "surface-container-low": "#f4f4ef",
              "outline": "#8f706c",
              "inverse-on-surface": "#f1f1ec",
              "tertiary-container": "#885f35",
              "tertiary": "#6c4820",
              "on-secondary": "#ffffff",
              "secondary-fixed": "#e5e2e1",
              "surface-container": "#eeeee9",
              "surface-tint": "#b91d20",
              "on-tertiary-fixed-variant": "#623f18",
              "on-primary": "#ffffff",
              "background": "#fafaf5",
              "secondary": "#5f5e5e",
              "primary-container": "#c62828",
              "error": "#ba1a1a",
              "primary-fixed-dim": "#ffb4ac",
              "outline-variant": "#e4beba",
              "surface-variant": "#e3e3de",
              "on-surface": "#1a1c19",
              "on-secondary-fixed-variant": "#474746"
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
            grid-template-columns: 1fr 1fr;
            min-height: 100vh;
        }
        @media (max-width: 768px) {
            .editorial-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body antialiased">
<main class="editorial-grid overflow-hidden">
<!-- Visual Column -->
<section class="relative hidden md:flex items-center justify-center p-12 bg-surface-container-low">
<div class="absolute inset-0 z-0">
<img alt="Warm minimalist study space" class="w-full h-full object-cover" data-alt="A warm minimalist study space with a sleek oak desk, a singular Bauhaus-style lamp, and soft afternoon light casting long shadows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_A5Pl7xQDllG-Iwf0zCPMKmiue5IbZ-A_3mMONT9t1y2MoXH3Zt2IArwreXnxIZ4uedx_L1VfjzM32WrC_zGvv7MwP5e3UWoFX0cxgPO1HS9rS99meOIgu-_fp_LWv0kOssgLUiF1oyNQsSfJzQuHi8Crl5BOkUMGkrj4nrsHAJvZK15wH-wbFeIhit1xo4-gU5ldJoD7v2DEVcTU94-xHeNNzoUTGCGl2UbB8E33jQtVslAFV5aHTIuXS3_bJB3Us4rSqcbyPQ"/>
<div class="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
</div>
<div class="relative z-10 w-full max-w-lg">
<div class="bg-surface/80 backdrop-blur-2xl p-12 rounded-xl shadow-2xl">
<h1 class="font-headline font-black text-6xl tracking-tighter text-on-surface mb-6 leading-none">
                        Leidenschaft<br/>Klub
                    </h1>
<p class="text-on-surface-variant text-lg leading-relaxed max-w-sm">
                        Precision in Learning. A space where German heritage meets modern digital excellence. Join our community of dedicated learners.
                    </p>
<div class="mt-12 flex items-center gap-4">
<div class="h-px flex-1 bg-outline-variant/30"></div>
<span class="font-headline font-bold text-primary tracking-widest text-xs uppercase">Est. 2024</span>
<div class="h-px flex-1 bg-outline-variant/30"></div>
</div>
</div>
</div>
</section>
<!-- Form Column -->
<section class="flex flex-col justify-center px-8 py-12 md:px-24 bg-surface lg:shadow-[-32px_0_64px_rgba(26,28,25,0.04)] z-20">
<div class="max-w-md w-full mx-auto">
<header class="mb-10">
<div class="md:hidden mb-8">
<span class="font-headline font-black text-2xl tracking-tighter text-primary">Leidenschaft Klub</span>
</div>
<h2 class="font-headline font-extrabold text-4xl tracking-tighter text-on-surface mb-2">Create Account</h2>
<p class="text-on-surface-variant">Start your journey with cultural warmth and professional precision.</p>
</header>
<form class="space-y-6">
<!-- Role Selection -->
<div class="grid grid-cols-2 gap-4 mb-8">
<label class="relative cursor-pointer group">
<input checked="" class="peer sr-only" name="role" type="radio" value="student"/>
<div class="p-4 border border-transparent bg-surface-container-low rounded-xl peer-checked:bg-primary/5 peer-checked:border-primary/20 transition-all duration-300">
<span class="material-symbols-outlined block mb-2 text-on-surface-variant peer-checked:text-primary">school</span>
<span class="block font-headline font-bold text-sm tracking-tight text-on-surface">Student</span>
</div>
</label>
<label class="relative cursor-pointer group">
<input class="peer sr-only" name="role" type="radio" value="admin"/>
<div class="p-4 border border-transparent bg-surface-container-low rounded-xl peer-checked:bg-primary/5 peer-checked:border-primary/20 transition-all duration-300">
<span class="material-symbols-outlined block mb-2 text-on-surface-variant peer-checked:text-primary">admin_panel_settings</span>
<span class="block font-headline font-bold text-sm tracking-tight text-on-surface">Admin</span>
</div>
</label>
</div>
<!-- Input Fields -->
<div class="space-y-4">
<div>
<label class="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2" for="name">Full Name</label>
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-secondary-container/40" id="name" placeholder="Erich Maria Remarque" type="text"/>
</div>
<div>
<label class="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2" for="email">Email Address</label>
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-secondary-container/40" id="email" placeholder="erich@leidenschaft.com" type="email"/>
</div>
<div>
<label class="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2" for="phone">Phone Number</label>
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-secondary-container/40" id="phone" placeholder="+49 000 0000000" type="tel"/>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2" for="password">Password</label>
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-secondary-container/40" id="password" placeholder="••••••••" type="password"/>
</div>
<div>
<label class="block font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2" for="confirm">Confirm</label>
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-secondary-container/40" id="confirm" placeholder="••••••••" type="password"/>
</div>
</div>
</div>
<div class="flex items-start gap-3 py-2">
<input class="mt-1 rounded border-outline-variant text-primary focus:ring-primary/20" id="terms" type="checkbox"/>
<label class="text-xs text-on-surface-variant leading-relaxed" for="terms">
                            I agree to the <a class="text-primary hover:underline" href="#">Terms of Service</a> and <a class="text-primary hover:underline" href="#">Privacy Policy</a>.
                        </label>
</div>
<button class="w-full bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold py-4 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" type="submit">
                        Register Account
                    </button>
</form>
<footer class="mt-10 text-center">
<p class="text-sm text-on-surface-variant">
                        Already have an account? <a class="font-bold text-primary hover:underline" href="#">Sign In</a>
</p>
</footer>
</div>
</section>
</main>
<!-- Global Footer Fragment (from Shared Components) -->
<footer class="w-full py-12 px-8 bg-surface-container-low border-t border-on-surface/5">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-center">
<div>
<span class="font-headline font-bold text-on-surface tracking-tighter text-xl">Leidenschaft Klub</span>
<p class="font-body text-xs tracking-wide text-on-surface/60 mt-2">© 2024 Leidenschaft Klub. Precision in Learning.</p>
</div>
<div class="lg:col-span-3 flex flex-wrap gap-x-8 gap-y-4 justify-end">
<a class="font-body text-xs tracking-wide text-on-surface/60 hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a class="font-body text-xs tracking-wide text-on-surface/60 hover:text-primary transition-colors" href="#">Terms of Service</a>
<a class="font-body text-xs tracking-wide text-on-surface/60 hover:text-primary transition-colors" href="#">Cookie Policy</a>
<a class="font-body text-xs tracking-wide text-on-surface/60 hover:text-primary transition-colors" href="#">Imprint</a>
</div>
</div>
</footer>
</body></html>