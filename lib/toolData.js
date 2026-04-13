// Built-in AI Tools
export const builtinTools = [
  {
    id: 'color-palette-generator',
    name: 'Color Palette Generator',
    description: 'Generate beautiful color palettes using AI',
    fullDescription: 'Create harmonious color combinations for your projects using our AI-powered color palette generator. Get suggestions based on color theory and current design trends.',
    icon: '🎨',
    category: 'Colors',
    path: '/tool/color-palette-generator',
    type: 'builtin',
    featured: true
  },
  {
    id: 'gradient-generator',
    name: 'Gradient Generator',
    description: 'Create stunning gradients with ease',
    fullDescription: 'Design beautiful gradients with our intuitive gradient generator. Choose from preset styles or create custom gradients with multiple color stops.',
    icon: '🌈',
    category: 'Colors',
    path: '/tool/gradient-generator',
    type: 'builtin',
    featured: true
  },
  {
    id: 'box-shadow-generator',
    name: 'Shadow Generator',
    description: 'Generate CSS box shadows instantly',
    fullDescription: 'Create perfect box shadows for your elements with our shadow generator. Customize spread, blur, and color to match your design.',
    icon: '💫',
    category: 'Effects',
    path: '/tool/box-shadow-generator',
    type: 'builtin',
    featured: true
  },
  {
    id: 'image-optimizer',
    name: 'Image Optimizer',
    description: 'Optimize images for web performance',
    fullDescription: 'Optimize your images for web use with our image optimizer. Reduce file size while maintaining quality, and get different format options.',
    icon: '🖼️',
    category: 'Images',
    path: '/tool/image-optimizer',
    type: 'builtin'
  },
  {
    id: 'layout-generator',
    name: 'Layout Generator',
    description: 'Create responsive layouts with AI',
    fullDescription: 'Generate responsive layouts using AI-powered suggestions and best practices.',
    icon: '📐',
    category: 'Layout',
    path: '/tool/layout-generator',
    type: 'builtin'
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Brainstorming with AI',
    fullDescription: 'Use AI to help brainstorm and refine your project ideas with intelligent suggestions.',
    icon: '💡',
    category: 'Ideas',
    path: '/tool/brainstorming',
    type: 'builtin'
  },
  {
    id: 'code-snippet-generator',
    name: 'Code Snippet Generator',
    description: 'Generate code snippets with AI',
    fullDescription: 'Create code snippets with our AI-powered code snippet generator. Get suggestions based on your project requirements.',
    icon: '💻',
    category: 'Code',
    path: '/tool/code-snippet-generator',
    type: 'builtin'
  },
  {
    id: 'project-suggestion',
    name: 'Project Suggestion',
    description: 'Generate project ideas with AI',
    fullDescription: 'Generate project ideas with our AI-powered project suggestion tool.',
    icon: '🚀',
    category: 'Ideas',
    path: '/tool/project-suggestion',
    type: 'builtin'
  }
];

// External Tools (complete list from tools.js with IDs added)
export const externalTools = [
  {
    id: 'ext-unsplash',
    name: 'Unsplash',
    description: 'A collection of high-quality, free-to-use images for your projects',
    url: 'https://unsplash.com',
    category: 'Design',
    icon: '📷',
    type: 'external'
  },
  {
    id: 'ext-fontawesome',
    name: 'Font Awesome',
    description: 'Vector icons and social logos for your projects',
    url: 'https://fontawesome.com',
    category: 'Design',
    icon: '🖌️',
    type: 'external'
  },
  {
    id: 'ext-tinypng',
    name: 'TinyPNG',
    description: 'Compress images without losing quality',
    url: 'https://tinypng.com',
    category: 'Performance',
    icon: '⚡',
    type: 'external'
  },
  {
    id: 'ext-carbonmade',
    name: 'Carbonmade',
    description: 'Create a visually appealing portfolio site without coding',
    url: 'https://carbonmade.com/',
    category: 'Portfolio',
    icon: '🖥️',
    type: 'external'
  },
  {
    id: 'ext-journo',
    name: 'Journo Portfolio',
    description: 'Design-focused portfolio site for creatives like photographers and designers',
    url: 'https://www.journoportfolio.com/',
    category: 'Portfolio',
    icon: '🖼️',
    type: 'external'
  },
  {
    id: 'ext-coroflot',
    name: 'CoroFlot',
    description: 'Portfolio site for creative professionals to showcase design and art',
    url: 'https://www.coroflot.com/',
    category: 'Portfolio',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-portfoliobox',
    name: 'Portfolio Box',
    description: 'Build and customize your portfolio site without coding',
    url: 'https://www.portfoliobox.net/',
    category: 'Portfolio',
    icon: '📦',
    type: 'external'
  },
  {
    id: 'ext-sejda',
    name: 'Sejda PDF',
    description: 'Free online tool for editing and modifying PDFs',
    url: 'https://www.sejda.com/',
    category: 'Dev Tools',
    icon: '📄',
    type: 'external'
  },
  {
    id: 'ext-rewritify',
    name: 'Rewritify.ai',
    description: 'AI-powered tool to improve and rewrite text for better content',
    url: 'https://rewritify.ai/',
    category: 'Dev Tools',
    icon: '🤖',
    type: 'external'
  },
  {
    id: 'ext-visbug',
    name: 'VisBug',
    description: 'Browser extension to inspect and modify elements directly on a webpage',
    url: 'https://visbug.web.app/',
    category: 'Browser Extensions',
    icon: '🔧',
    type: 'external'
  },
  {
    id: 'ext-linkredirect',
    name: 'Link Redirect Trace',
    description: 'Browser extension to identify and fix redirection issues',
    url: 'https://chrome.google.com/webstore/detail/link-redirect-trace/ljdobmomdgdljniojadhoplhkpialdid',
    category: 'Browser Extensions',
    icon: '🔗',
    type: 'external'
  },
  {
    id: 'ext-webdeveloper',
    name: 'Web Developer',
    description: 'Browser extension to identify SEO, security, and performance issues',
    url: 'https://chrome.google.com/webstore/detail/web-developer/bfbameneiokkgbdmiekhjnmfkcnldhhm',
    category: 'Browser Extensions',
    icon: '🌐',
    type: 'external'
  },
  {
    id: 'ext-sitepalette',
    name: 'Site Palette',
    description: 'Extract color palettes from any website for design inspiration',
    url: 'https://sitepalette.com/',
    category: 'Browser Extensions',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-responsiveviewer',
    name: 'Responsive Viewer',
    description: 'Test responsive web designs on various devices',
    url: 'https://chrome.google.com/webstore/detail/responsive-viewer/iblinbgnkmpmeobcpmicamhjdpnlkggc',
    category: 'Browser Extensions',
    icon: '📱',
    type: 'external'
  },
  {
    id: 'ext-gsap',
    name: 'GSAP',
    description: 'Powerful JavaScript library for high-performance animations',
    url: 'https://gsap.com/',
    category: 'JavaScript Libraries',
    icon: '✨',
    type: 'external'
  },
  {
    id: 'ext-jquery',
    name: 'JQuery',
    description: 'Fast, feature-rich JavaScript library for DOM manipulation and AJAX',
    url: 'https://jquery.com/',
    category: 'JavaScript Libraries',
    icon: '📜',
    type: 'external'
  },
  {
    id: 'ext-threejs',
    name: 'Three.js',
    description: '3D graphics and animation library for interactive content using WebGL',
    url: 'https://threejs.org/',
    category: 'JavaScript Libraries',
    icon: '🔷',
    type: 'external'
  },
  {
    id: 'ext-animejs',
    name: 'Anime.js',
    description: 'Lightweight, flexible animation library for stunning web animations',
    url: 'https://animejs.com/',
    category: 'JavaScript Libraries',
    icon: '🎬',
    type: 'external'
  },
  {
    id: 'ext-d3js',
    name: 'D3.js',
    description: 'JavaScript library for data-driven documents and visualizations',
    url: 'https://d3js.org/',
    category: 'JavaScript Libraries',
    icon: '📊',
    type: 'external'
  },
  {
    id: 'ext-velocityjs',
    name: 'Velocity.js',
    description: 'Optimized animation engine for fast, fluid animations',
    url: 'https://velocityjs.org/',
    category: 'JavaScript Libraries',
    icon: '🏎️',
    type: 'external'
  },
  {
    id: 'ext-dribbble',
    name: 'Dribbble',
    description: 'Creative community and design inspiration platform',
    url: 'https://dribbble.com/',
    category: 'Design Inspiration',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-behance',
    name: 'Behance',
    description: 'Platform for showcasing creative work and finding inspiration',
    url: 'https://www.behance.net/',
    category: 'Design Inspiration',
    icon: '🖌️',
    type: 'external'
  },
  {
    id: 'ext-lordicon',
    name: 'Lordicon',
    description: 'Free and premium animated icons for web projects',
    url: 'https://lordicon.com/',
    category: 'Icons & SVG',
    icon: '🔲',
    type: 'external'
  },
  {
    id: 'ext-iconhunt',
    name: 'IconHunt',
    description: 'Search engine for free and high-quality icons',
    url: 'https://iconhunt.io/',
    category: 'Icons & SVG',
    icon: '🔍',
    type: 'external'
  },
  {
    id: 'ext-svgrepo',
    name: 'SVG Repo',
    description: 'Library of free SVG illustrations and icons',
    url: 'https://www.svgrepo.com/',
    category: 'Icons & SVG',
    icon: '📂',
    type: 'external'
  },
  {
    id: 'ext-idraw',
    name: 'iDraw.js',
    description: 'JavaScript library for drawing and editing vector graphics',
    url: 'https://github.com/clyderick/idraw',
    category: 'Icons & SVG',
    icon: '✏️',
    type: 'external'
  },
  {
    id: 'ext-fancyborder',
    name: 'Fancy Border Radius',
    description: 'Create complex and stylish border radius designs',
    url: 'https://9elements.github.io/fancy-border-radius/',
    category: 'Shapes & Effects',
    icon: '🖼️',
    type: 'external'
  },
  {
    id: 'ext-cssfilters',
    name: 'CSS Filters',
    description: 'Apply creative filter effects to your CSS designs',
    url: 'https://cssfilters.co/',
    category: 'Shapes & Effects',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-ribbonshapes',
    name: 'Ribbon Shapes',
    description: 'Generate CSS code for decorative ribbon shapes',
    url: 'https://css-generators.com/ribbon-shapes/',
    category: 'Shapes & Effects',
    icon: '🎀',
    type: 'external'
  },
  {
    id: 'ext-uiverse',
    name: 'Uiverse',
    description: 'Free and open-source UI elements for your projects',
    url: 'https://uiverse.io/',
    category: 'UI Resources',
    icon: '🖥️',
    type: 'external'
  },
  {
    id: 'ext-10015',
    name: '10015.io',
    description: 'Collection of free tools for designers and developers',
    url: 'https://10015.io/',
    category: 'UI Resources',
    icon: '🛠️',
    type: 'external'
  },
  {
    id: 'ext-materialdesign',
    name: 'Material Design',
    description: 'Google design system for building intuitive interfaces',
    url: 'https://m3.material.io/',
    category: 'UI Resources',
    icon: '📐',
    type: 'external'
  },
  {
    id: 'ext-cssloaders',
    name: 'CSS Loaders',
    description: 'Collection of loading animations for your projects',
    url: 'https://css-loaders.com/',
    category: 'UI Resources',
    icon: '⏳',
    type: 'external'
  },
  {
    id: 'ext-spinkit',
    name: 'Spinkit',
    description: 'Simple and stylish CSS loading animations',
    url: 'https://tobiasahlin.com/spinkit/',
    category: 'Animations',
    icon: '🔄',
    type: 'external'
  },
  {
    id: 'ext-whirl',
    name: 'Whirl',
    description: 'CSS loading animations with spinning and swirling effects',
    url: 'https://whirl.netlify.app/',
    category: 'Animations',
    icon: '🌀',
    type: 'external'
  },
  {
    id: 'ext-transitioncss',
    name: 'Transition CSS',
    description: 'Generate custom CSS transitions for smooth dynamic effects',
    url: 'https://www.transition.style/',
    category: 'Animations',
    icon: '🔄',
    type: 'external'
  },
  {
    id: 'ext-gradientanimator',
    name: 'Animated CSS Gradient',
    description: 'Create animated CSS gradient backgrounds',
    url: 'https://www.gradient-animator.com/',
    category: 'Animations',
    icon: '🌈',
    type: 'external'
  },
  {
    id: 'ext-neatcss',
    name: 'NEAT',
    description: 'Generate beautiful gradient animations with ease',
    url: 'https://neatcss.com/',
    category: 'Animations',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-coolors',
    name: 'Coolors',
    description: 'Fast and easy color palette generator',
    url: 'https://coolors.co/',
    category: 'Color Tools',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-colorspace',
    name: 'Color Space',
    description: 'Discover and generate perfect color palettes',
    url: 'https://mycolor.space/',
    category: 'Color Tools',
    icon: '🖍️',
    type: 'external'
  },
  {
    id: 'ext-cssgradient',
    name: 'CSS Gradient',
    description: 'Create beautiful CSS gradients with a visual editor',
    url: 'https://cssgradient.io/',
    category: 'Color Tools',
    icon: '🎨',
    type: 'external'
  },
  {
    id: 'ext-gradientmagic',
    name: 'Gradient Magic',
    description: 'Generate unique and creative gradients',
    url: 'https://www.gradientmagic.com/',
    category: 'Color Tools',
    icon: '✨',
    type: 'external'
  },
  {
    id: 'ext-huemint',
    name: 'Huemint',
    description: 'AI-powered color palette creator',
    url: 'https://huemint.com/',
    category: 'Color Tools',
    icon: '🤖',
    type: 'external'
  },
  {
    id: 'ext-csstricks',
    name: 'CSS-Tricks',
    description: 'Comprehensive CSS tips, tutorials, and examples',
    url: 'https://css-tricks.com/',
    category: 'CSS Tools',
    icon: '🧰',
    type: 'external'
  },
  {
    id: 'ext-freefrontend',
    name: 'FreeFrontend',
    description: 'Collection of free front-end resources and snippets',
    url: 'https://freefrontend.com/',
    category: 'CSS Tools',
    icon: '📑',
    type: 'external'
  },
  {
    id: 'ext-uideck',
    name: 'UI Deck',
    description: 'Free and premium HTML templates and themes',
    url: 'https://uideck.com/',
    category: 'CSS Tools',
    icon: '🖥️',
    type: 'external'
  },
  {
    id: 'ext-frontendmentor',
    name: 'Frontend Mentor',
    description: 'Real-world coding challenges to improve front-end skills',
    url: 'https://www.frontendmentor.io/',
    category: 'CSS Tools',
    icon: '💻',
    type: 'external'
  },
  {
    id: 'ext-codepen',
    name: 'CodePen Challenges',
    description: 'Weekly challenges to practice front-end skills',
    url: 'https://codepen.io/challenges',
    category: 'CSS Tools',
    icon: '🏆',
    type: 'external'
  },
  {
    id: 'ext-100dayscss',
    name: '100 Days CSS',
    description: 'Learn CSS by building animations and designs daily',
    url: 'https://100dayscss.com/',
    category: 'CSS Tools',
    icon: '📅',
    type: 'external'
  },
  {
    id: 'ext-dailyui',
    name: 'Daily UI',
    description: 'Daily user interface design challenges',
    url: 'https://www.dailyui.co/',
    category: 'CSS Tools',
    icon: '🖌️',
    type: 'external'
  },
  {
    id: 'ext-cssscan',
    name: 'CSS Scan',
    description: 'Instantly check and copy CSS from any element',
    url: 'https://getcssscan.com/',
    category: 'CSS Tools',
    icon: '🔍',
    type: 'external'
  },
  {
    id: 'ext-liveserver',
    name: 'Live Server',
    description: 'Local development server with live reload for VS Code',
    url: 'https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer',
    category: 'VS Code Extension',
    icon: '⚡',
    type: 'external'
  },
  {
    id: 'ext-livepreview',
    name: 'Live Preview',
    description: 'Real-time preview of web pages directly in VS Code',
    url: 'https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server',
    category: 'VS Code Extension',
    icon: '👀',
    type: 'external'
  },
  {
    id: 'ext-htmlendtag',
    name: 'HTML End Tag Labels',
    description: 'Labels closing HTML tags for better readability',
    url: 'https://marketplace.visualstudio.com/items?itemName=zignd.html-css-class-completion',
    category: 'VS Code Extension',
    icon: '📑',
    type: 'external'
  },
  {
    id: 'ext-highlighttag',
    name: 'Highlight Matching Tag',
    description: 'Highlights matching opening or closing tags in HTML',
    url: 'https://marketplace.visualstudio.com/items?itemName=vincaslt.highlight-matching-tag',
    category: 'VS Code Extension',
    icon: '🔖',
    type: 'external'
  },
  {
    id: 'ext-autorenametag',
    name: 'Auto Rename Tag',
    description: 'Automatically rename paired HTML/XML tags',
    url: 'https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag',
    category: 'VS Code Extension',
    icon: '✏️',
    type: 'external'
  },
  {
    id: 'ext-cssintellisense',
    name: 'CSS Class Completion',
    description: 'CSS class name completion for HTML based on workspace definitions',
    url: 'https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion',
    category: 'VS Code Extension',
    icon: '💡',
    type: 'external'
  }
];

// Combined tools array
export const allTools = [...builtinTools, ...externalTools];

// Get featured tools (for home page)
export const getFeaturedTools = () => {
  return builtinTools.filter(tool => tool.featured).slice(0, 4);
};

// Get unique categories from all tools
export const getAllCategories = () => {
  const categories = [...new Set(allTools.map(tool => tool.category))];
  return ['All', ...categories.sort()];
};

// Get unique categories from built-in tools
export const getBuiltinCategories = () => {
  const categories = [...new Set(builtinTools.map(tool => tool.category))];
  return ['All', ...categories.sort()];
};

// Get unique categories from external tools
export const getExternalCategories = () => {
  const categories = [...new Set(externalTools.map(tool => tool.category))];
  return ['All', ...categories.sort()];
};
