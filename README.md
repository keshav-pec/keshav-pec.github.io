# 🌟 Keshav Goyal - Portfolio Website

A modern, clean, and responsive portfolio website built with HTML, CSS, and JavaScript.

![Portfolio Preview](https://via.placeholder.com/1200x600/667eea/ffffff?text=Portfolio+Preview)

## ✨ Features

- **Modern Design**: Clean and professional layout with smooth animations
- **Fully Responsive**: Works perfectly on all devices (desktop, tablet, mobile)
- **Interactive Elements**: Smooth scrolling, typing effect, and hover animations
- **Sections Include**:
  - Hero section with social links
  - About me with profile image
  - Skills organized by categories
  - Experience timeline
  - Featured projects showcase
  - Contact form
  - Responsive navigation

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Customize the content** (see Customization Guide below)
3. **Open `index.html`** in your browser to view locally
4. **Deploy** to your preferred hosting platform

## 📝 Customization Guide

### 1. Personal Information

Open `index.html` and update:

- **Name and Title** (lines 42-44):
  ```html
  <h1 class="hero-title">Hi, I'm <span class="highlight">Your Name</span></h1>
  <p class="hero-subtitle">Your Title</p>
  ```

- **About Section** (lines 67-85):
  - Replace the about text with your own story
  - Update location, education, and experience details

- **Profile Image** (line 95):
  ```html
  <img src="your-image.jpg" alt="Your Name">
  ```
  Replace `IMG_20241119_224143_674.jpg` with your own profile picture

### 2. Social Links

Update social media links (lines 50-53 and 240-242):
```html
<a href="https://www.linkedin.com/in/your-profile/" target="_blank">
<a href="https://github.com/your-username" target="_blank">
<a href="mailto:your-email@example.com">
```

### 3. Skills

Edit the skills section (lines 103-140):
- Add or remove skill tags
- Organize by your technology stack
- Update category names if needed

### 4. Experience

Update the timeline section (lines 150-191):
- Replace company names and job titles
- Update dates and descriptions
- Add or remove timeline items

### 5. Projects

Customize projects (lines 199-265):
- Replace project images (use your own screenshots or keep placeholders)
- Update project names and descriptions
- Add GitHub/live demo links
- Update technology tags

### 6. Contact Information

Update contact details (lines 279-299):
```html
<a href="mailto:your-email@example.com">your-email@example.com</a>
<a href="tel:+919999999999">+91 99999 99999</a>
```

### 7. Colors and Styling

Edit `styles.css` (lines 10-18) to change color scheme:
```css
:root {
    --primary-color: #4a90e2;  /* Main theme color */
    --secondary-color: #2c3e50; /* Secondary color */
    --accent-color: #e94b3c;    /* Accent color */
}
```

### 8. Typing Effect

Edit `script.js` (lines 69-76) to customize the typing animation:
```javascript
const subtitles = [
    'Your Title 1',
    'Your Title 2',
    'Your Title 3'
];
```

## 🌐 Deployment Options

### Option 1: GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select main branch as source
5. Your site will be live at `https://yourusername.github.io/repository-name`

### Option 2: Netlify (Free)

1. Sign up at [netlify.com](https://www.netlify.com)
2. Drag and drop your folder
3. Your site will be live instantly with a custom URL

### Option 3: Vercel (Free)

1. Sign up at [vercel.com](https://vercel.com)
2. Import your GitHub repository or upload files
3. Deploy with one click

### Option 4: Traditional Hosting

Upload all files to your web hosting via FTP:
- Upload to public_html or www folder
- Access via your domain

## 📁 File Structure

```
Portfolio/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Interactive functionality
├── README.md           # This file
├── IMG_20241119_224143_674.jpg  # Profile image
└── 20230204_093957(1).jpg       # Additional image
```

## 🎨 Customization Tips

### Adding New Sections

To add a new section, follow this template in `index.html`:

```html
<section id="newsection" class="newsection">
    <div class="container">
        <h2 class="section-title">Section Title</h2>
        <!-- Your content here -->
    </div>
</section>
```

And add navigation link:
```html
<li><a href="#newsection" class="nav-link">Section</a></li>
```

### Changing Fonts

Add Google Fonts in the `<head>` of `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Then update in `styles.css`:
```css
body {
    font-family: 'Poppins', sans-serif;
}
```

### Adding More Projects

Copy a project card block and modify:
```html
<div class="project-card">
    <div class="project-image">
        <img src="project-image.jpg" alt="Project Name">
        <div class="project-overlay">
            <a href="live-link" class="project-link" target="_blank">
                <i class="fas fa-external-link-alt"></i>
            </a>
            <a href="github-link" class="project-link" target="_blank">
                <i class="fab fa-github"></i>
            </a>
        </div>
    </div>
    <div class="project-info">
        <h3>Project Name</h3>
        <p>Project description here.</p>
        <div class="project-tags">
            <span>Tech1</span>
            <span>Tech2</span>
        </div>
    </div>
</div>
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🔧 Technologies Used

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts

## 📄 License

Feel free to use this template for your personal portfolio. No attribution required!

## 🤝 Support

If you need help customizing your portfolio:
1. Check the comments in the code
2. Refer to this README
3. Search for tutorials on HTML/CSS/JavaScript basics

## 🎯 Next Steps

After customization:
1. ✅ Update all personal information
2. ✅ Add your own projects
3. ✅ Replace placeholder images
4. ✅ Update contact information
5. ✅ Test on different devices
6. ✅ Deploy to hosting platform
7. ✅ Share your portfolio!

## 📸 Screenshots

### Desktop View
The portfolio features a full-width hero section with gradient background, followed by well-organized sections for about, skills, experience, projects, and contact.

### Mobile View
Fully responsive design with hamburger menu and optimized layouts for smaller screens.

---

**Built with ❤️ by Keshav Goyal**

For questions or suggestions, feel free to reach out via the contact form on the website!

## 🏆 Hacktoberfest 2025

I participated in Hacktoberfest 2025, contributing to documentation improvements, bug fixes, and accessibility enhancements across several open-source repositories. Highlights:

- Contributed to 6+ repositories (documentation, tests, small features)
- Fixed accessibility issues in frontend components (aria attributes, keyboard navigation)
- Added unit tests and improved README contribution guides to help future contributors

See my contributions on GitHub: https://github.com/keshav-pec?tab=repositories
