function loadProfilePicture() {
    const profileImage = document.querySelector('.profile-image');
    if (profileImage) {
        profileImage.src = 'Pictures/PicturesOfMe/AboutMe.jpg';
        
        // Add error handling just in case
        profileImage.onerror = function() {
            console.log('Failed to load profile picture');
            console.log('Attempted path:', profileImage.src);
            profileImage.alt = "Profile picture unavailable";
        };
    }
}

// Load picture when the page loads
document.addEventListener('DOMContentLoaded', loadProfilePicture); 