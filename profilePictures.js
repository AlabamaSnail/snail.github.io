function loadProfilePicture() {
    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        profileImage.src = 'Pictures/PicturesOfMe/AboutMe.jpg';
        
        profileImage.onerror = function() {
            console.log('Failed to load profile picture');
            console.log('Attempted path:', profileImage.src);
            console.log('Current page location:', window.location.href);
            profileImage.alt = "Profile picture unavailable";
        };

        // Add onload handler to confirm when image loads successfully
        profileImage.onload = function() {
            console.log('Image loaded successfully');
        };
    }
}

// Load picture when the page loads
document.addEventListener('DOMContentLoaded', loadProfilePicture); 