// Global variables
let isSingleTrackMode = false;
const formData = { release: {}, tracks: [] };

// Available roles for contributors
const availableRoles = {
    performer: ['Vocalist', 'Guitar', 'Drums', 'Bass', 'Piano', 'Keyboard', 'Saxophone', 'Trumpet', 'Violin', 'Cello', 'Programming', 'Background Vocals', 'Flute'],
    composition: ['Composer', 'Lyricist', 'Arranger', 'Songwriter', 'Co-writer'],
    production: ['Producer', 'Engineer', 'Mixer', 'Mastering Engineer', 'Recording Engineer', 'Executive Producer']
};

document.addEventListener('DOMContentLoaded', function() {
    // Check if JSZip and FileSaver are loaded
    if (typeof JSZip === 'undefined') {
        console.error('JSZip library not found. Make sure it is included in the HTML.');
        alert('Error: JSZip library is missing. Export functionality may not work.');
    }
    if (typeof saveAs === 'undefined') {
        console.error('FileSaver library not found. Make sure it is included in the HTML.');
        alert('Error: FileSaver library is missing. Export functionality may not work.');
    }


    // Set up release form artist mechanism
    setupArtistMechanism('artist-container', 'artists[]', true);
    setupOtherArtistMechanism('featured-artist-container', 'featuredArtists[]', 'add-featured-artist-btn');
    setupOtherArtistMechanism('remixer-container', 'remixers[]', 'add-remixer-btn');

    // Set up Mix/Version toggle for release
    document.getElementById('add-mix-version-btn').addEventListener('click', function() {
        document.getElementById('mixVersionContainer').style.display = 'block';
        this.style.display = 'none';
    });

    // Set up Mix/Version remove button for release
    document.getElementById('remove-mix-version-btn').addEventListener('click', function() {
        document.getElementById('mixVersionContainer').style.display = 'none';
        document.getElementById('add-mix-version-btn').style.display = 'inline-flex';
        document.getElementById('mixVersion').value = ''; // Clear the value
    });

    // Set up Original Release Date visibility toggle
    const isReReleaseCheckbox = document.getElementById('isReRelease');
    const originalDateContainer = document.getElementById('originalReleaseDateContainer');
    const originalDateInput = document.getElementById('originalReleaseDate');

    if (isReReleaseCheckbox && originalDateContainer && originalDateInput) {
        isReReleaseCheckbox.addEventListener('change', function() {
            if (this.checked) {
                originalDateContainer.style.display = 'block';
            } else {
                originalDateContainer.style.display = 'none';
                originalDateInput.value = '';
            }
        });
        // Ensure container visibility matches checkbox state on initial load
        if (isReReleaseCheckbox.checked) {
             originalDateContainer.style.display = 'block';
        } else {
             originalDateContainer.style.display = 'none';
        }
    } else {
        console.error("Could not find re-release checkbox or container elements.");
    }

    // Set up Artwork Preview
    const artworkFileInput = document.getElementById('releaseArtworkFile');
    const artworkPreviewImg = document.getElementById('artworkPreview');
    const artworkFileNameDisplay = document.getElementById('artworkFileNameDisplay');

    if (artworkFileInput && artworkPreviewImg && artworkFileNameDisplay) {
        artworkFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    artworkPreviewImg.src = e.target.result;
                    artworkPreviewImg.style.display = 'block'; // Show preview
                }
                reader.readAsDataURL(file);
                artworkFileNameDisplay.textContent = file.name; // Show filename
                artworkFileNameDisplay.style.color = 'var(--text-color)';
            } else {
                // Clear preview if no file or invalid file type
                artworkPreviewImg.src = '#'; // Reset src
                artworkPreviewImg.style.display = 'none'; // Hide preview
                if (file) { // If a file was selected but invalid
                     artworkFileNameDisplay.textContent = 'Invalid file type (select image)';
                     artworkFileNameDisplay.style.color = 'var(--danger-color)';
                     artworkFileInput.value = ''; // Clear the invalid file selection
                } else {
                     artworkFileNameDisplay.textContent = 'No file selected';
                     artworkFileNameDisplay.style.color = 'var(--gray-600)';
                }
            }
        });
    } else {
        console.error("Could not find artwork file input, preview, or filename display elements.");
    }


    // Set up territory management
    setupTerritoryManagement();

    // Set up navigation buttons (Single/Multi Track)
    document.getElementById('single-track-btn').addEventListener('click', function() { navigateToTracks(true); });
    document.getElementById('multi-track-btn').addEventListener('click', function() { navigateToTracks(false); });

    // Navigation function
    function navigateToTracks(isSingleMode) {
         if (validateReleaseForm()) {
            isSingleTrackMode = isSingleMode;
            saveReleaseData();
            document.getElementById('release-page').classList.remove('active');
            document.getElementById('tracks-page').classList.add('active');
            document.getElementById('step-1').classList.remove('active');
            document.getElementById('step-1').classList.add('completed');
            document.getElementById('step-2').classList.add('active');

            const indicator = document.getElementById('release-type-indicator');
            const tracksContainer = document.getElementById('tracks-container');
            const addTrackBtn = document.getElementById('add-track-btn');

            if (isSingleTrackMode) {
                indicator.textContent = 'Single Track Release';
                indicator.className = 'release-type-indicator single';
                addTrackBtn.style.display = 'none';
                // Only add prefilled track if none exist or switching modes
                if (formData.tracks.length === 0 || tracksContainer.children.length === 0 || !isSingleTrackMode) { // Check previous mode state if needed
                    tracksContainer.innerHTML = ''; // Clear existing tracks if switching to single
                    addSingleTrackWithPrefill();
                }
            } else {
                indicator.textContent = 'Multiple Track Release';
                indicator.className = 'release-type-indicator multiple';
                addTrackBtn.style.display = 'block';
                // Only add initial track if none exist
                 if (formData.tracks.length === 0 || tracksContainer.children.length === 0) {
                    tracksContainer.innerHTML = ''; // Clear existing tracks if switching to multi with no tracks
                    addTrack();
                }
                updateRemoveButtons(); // Ensure buttons are correct for multi-track
            }
        }
    }


    // Back to release button
    document.getElementById('back-to-release').addEventListener('click', function() {
        saveTrackData(); // Save current track data before navigating away
        document.getElementById('tracks-page').classList.remove('active');
        document.getElementById('release-page').classList.add('active');
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-1').classList.remove('completed');
        document.getElementById('step-1').classList.add('active');
    });

    // Continue to export button
    document.getElementById('continue-to-export').addEventListener('click', function() {
        if (validateTracksForm()) {
            saveTrackData(); // Save final track data before navigating
            createDataSummary(); // Update summary before showing export page
            document.getElementById('tracks-page').classList.remove('active');
            document.getElementById('export-page').classList.add('active');
            document.getElementById('step-2').classList.remove('active');
            document.getElementById('step-2').classList.add('completed');
            document.getElementById('step-3').classList.add('active');
        }
    });

    // Back to tracks button
    document.getElementById('back-to-tracks').addEventListener('click', function() {
        document.getElementById('export-page').classList.remove('active');
        document.getElementById('tracks-page').classList.add('active');
        document.getElementById('step-3').classList.remove('active');
        document.getElementById('step-2').classList.remove('completed');
        document.getElementById('step-2').classList.add('active');
        // Hide status message when going back
        const statusDiv = document.getElementById('export-status');
        if (statusDiv) statusDiv.style.display = 'none';
    });

    // Export to ZIP button event listener
    const exportZipBtn = document.getElementById('export-zip-btn');
    if (exportZipBtn) {
        exportZipBtn.addEventListener('click', function() {
            // Re-validate just before export
            if (!validateReleaseForm()) {
                 alert("Please ensure all required fields on the Release Info page are filled correctly.");
                 // Navigate back to Release page if invalid? Or just show alert.
                 // For now, just alert. Consider navigating back if UX demands it.
                 return;
            }
             if (!validateTracksForm()) {
                 alert("Please ensure all required fields on the Track Details page are filled correctly.");
                 // Navigate back to Tracks page if invalid?
                 return;
            }

            // Save latest data just in case something changed without navigating
            saveReleaseData();
            saveTrackData();

            if (formData.tracks.length === 0) {
                alert('Please add at least one track before exporting.');
                return;
            }

            // Check performer requirement again (redundant if validateTracksForm is thorough, but safe)
            let hasInvalidPerformer = false;
            formData.tracks.forEach((track, index) => {
                if (!track.performers || track.performers.length === 0 ||
                    !track.performers.some(p => p.name && p.roles && p.roles.length > 0)) {
                    // This specific check might be better inside validateTracksForm
                    alert(`Track ${index + 1} (${track.name || 'Untitled'}) must have at least one performer with a name and role.`);
                    hasInvalidPerformer = true;
                }
            });
            if (hasInvalidPerformer) return;


            // Call the exportToZip function
            exportToZip();
        });
    } else {
        console.error("Export ZIP button not found.");
    }

    // Add Track Button event listener
    document.getElementById('add-track-btn').addEventListener('click', function() {
        addTrack();
        updateRemoveButtons(); // Ensure remove buttons are updated after adding
    });


    // Function to handle radio toggle state classes
    function setupRadioToggleState(groupElement) {
        function updateStateClass() {
            const checkedInput = groupElement.querySelector('input:checked');
            if (checkedInput) {
                const selectedValue = checkedInput.value;
                groupElement.classList.remove('selected-no', 'selected-yes', 'selected-cleaned');
                if (selectedValue === 'No') groupElement.classList.add('selected-no');
                else if (selectedValue === 'Yes') groupElement.classList.add('selected-yes');
                else if (selectedValue === 'Cleaned') groupElement.classList.add('selected-cleaned');
            }
        }
        groupElement.addEventListener('change', updateStateClass);
        updateStateClass(); // Initial setup
    }

    // Function to save release data
    function saveReleaseData() {
        // Get artwork file object
        const artworkFileInput = document.getElementById('releaseArtworkFile');
        const artworkFileObject = (artworkFileInput && artworkFileInput.files.length > 0) ? artworkFileInput.files[0] : null;

        formData.release = {
            title: document.getElementById('releaseTitle')?.value || '',
            mixVersion: document.getElementById('mixVersion')?.value || '',
            releaseDate: document.getElementById('releaseDate')?.value || '',
            isReRelease: document.getElementById('isReRelease')?.checked || false,
            originalReleaseDate: (document.getElementById('isReRelease')?.checked) ? (document.getElementById('originalReleaseDate')?.value || '') : '',
            labelName: document.getElementById('labelName')?.value || '',
            catNumber: document.getElementById('catNumber')?.value || '',
            upc: document.getElementById('upc')?.value || '',
            genre: document.getElementById('albumGenre')?.value || '',
            cLine: document.getElementById('albumCLine')?.value || '',
            pLine: document.getElementById('albumPLine')?.value || '',
            isWorldwide: document.getElementById('is-worldwide')?.value === 'true',
            artworkFileObject: artworkFileObject,
            artworkFileName: artworkFileObject ? artworkFileObject.name : '',
            artists: getInputValuesArray('artist-container'),
            featuredArtists: getInputValuesArray('featured-artist-container'),
            remixers: getInputValuesArray('remixer-container')
        };

        try { // Territories
            const territoriesData = JSON.parse(document.getElementById('territories-data')?.value || '[]');
            const territoriesMode = document.getElementById('territories-mode')?.value || 'include';
            formData.release.territories = { mode: territoriesMode, codes: territoriesData.map(t => t.code) };
        } catch (e) {
            formData.release.territories = { mode: 'include', codes: [] };
            console.error('Error parsing territories:', e);
        }
        // console.log("Saved Release Data:", JSON.stringify(formData.release, null, 2)); // Deeper log for debugging
    }

    // Function to save track data
    function saveTrackData() {
        const trackModules = document.querySelectorAll('.track-module');
        formData.tracks = []; // Reset tracks array before saving

        trackModules.forEach((module, index) => {
            const zeroBasedIndex = index;
            const trackNumber = index + 1; // Use 1-based index for track number property

            // Get the audio File object
            const audioFileInput = module.querySelector(`input[id^="trackAudioFile"]`);
            const audioFileObject = (audioFileInput && audioFileInput.files.length > 0) ? audioFileInput.files[0] : null;

            const track = {
                trackNumber: trackNumber,
                discNumber: 1, // Assuming single disc for now
                name: module.querySelector(`input[id^="trackName"]`)?.value || '',
                mixVersion: module.querySelector(`input[id^="trackMixVersion"]`)?.value || '',
                genre: module.querySelector(`select[id^="trackGenre"]`)?.value || '',
                isrc: module.querySelector(`input[id^="trackISRC"]`)?.value || '',
                secondaryIsrc: module.querySelector(`input[id^="trackSecondaryISRC"]`)?.value || '',
                language: module.querySelector(`select[id^="trackLanguage"]`)?.value || '',
                explicit: module.querySelector(`input[name="tracks[${zeroBasedIndex}][explicit]"]:checked`)?.value || 'No', // Default to 'No'
                dolbyAtmos: module.querySelector(`input[id^="trackDolbyAtmos"]`)?.checked || false,
                lyrics: module.querySelector(`textarea[id^="trackLyrics"]`)?.value || '',
                // Store the audio File object and its name
                audioFileObject: audioFileObject,
                audioFileName: audioFileObject ? audioFileObject.name : ''
            };

            // Get artists/contributors for the track
            const artistContainer = module.querySelector(`div[id^="track-artist-container"]`);
            const featuredArtistContainer = module.querySelector(`div[id^="track-featured-artist-container"]`);
            const remixerContainer = module.querySelector(`div[id^="track-remixer-container"]`);
            const publisherContainer = module.querySelector(`div[id^="track-publisher-container"]`);
            const performerContainer = module.querySelector(`div[id^="track-performer-container"]`);
            const compositionContainer = module.querySelector(`div[id^="track-composition-container"]`);
            const productionContainer = module.querySelector(`div[id^="track-production-container"]`);

            track.artists = getInputValuesArrayFromElement(artistContainer);
            track.featuredArtists = getInputValuesArrayFromElement(featuredArtistContainer);
            track.remixers = getInputValuesArrayFromElement(remixerContainer);
            track.publishers = getInputValuesArrayFromElement(publisherContainer);
            track.performers = getContributorsFromContainer(performerContainer) || [];
            track.composition = getContributorsFromContainer(compositionContainer) || [];
            track.production = getContributorsFromContainer(productionContainer) || [];

            formData.tracks.push(track);
        });
         // console.log('Saved Track Data:', JSON.stringify(formData.tracks, null, 2)); // Deeper log for debugging
    }


    // Create data summary for export page
    function createDataSummary() {
        const summary = document.getElementById('data-summary');
        if (!summary) return; // Exit if summary element doesn't exist
        summary.innerHTML = ''; // Clear previous summary

        // Helper to format dates consistently
        function formatDate(dateStr) {
             if (!dateStr) return 'Not specified';
             // Attempt to parse the date; assumes YYYY-MM-DD input from date picker
             const date = new Date(dateStr + 'T00:00:00'); // Add time part to avoid timezone issues
             if (isNaN(date.getTime())) return 'Invalid Date'; // Check if date is valid
             return date.toLocaleDateString(navigator.language || 'en-US', { // Use browser locale or default
                year: 'numeric', month: 'long', day: 'numeric'
             });
         }
         // Helper to safely escape HTML characters
         function escapeHtml(unsafe) {
             if (typeof unsafe !== 'string') return ''; // Handle non-string inputs
             return unsafe
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
         }

        // --- Release Summary Section ---
        const releaseSummary = document.createElement('div');
        releaseSummary.className = 'summary-section';
        let releaseHtml = `<h3 class="summary-title">Release Summary</h3><ul class="summary-list">`;
        releaseHtml += `<li><span class="summary-property">Title:</span> <span class="summary-value">${escapeHtml(formData.release.title) || 'N/A'}</span></li>`;
        if (formData.release.mixVersion) releaseHtml += `<li><span class="summary-property">Mix/Version:</span> <span class="summary-value">${escapeHtml(formData.release.mixVersion)}</span></li>`;
        releaseHtml += `<li><span class="summary-property">Artists:</span> <span class="summary-value">${(formData.release.artists && formData.release.artists.length > 0) ? escapeHtml(formData.release.artists.join(', ')) : 'N/A'}</span></li>`;
        if (formData.release.featuredArtists && formData.release.featuredArtists.length > 0) releaseHtml += `<li><span class="summary-property">Featured:</span> <span class="summary-value">${escapeHtml(formData.release.featuredArtists.join(', '))}</span></li>`;
        if (formData.release.remixers && formData.release.remixers.length > 0) releaseHtml += `<li><span class="summary-property">Remixers:</span> <span class="summary-value">${escapeHtml(formData.release.remixers.join(', '))}</span></li>`;
        releaseHtml += `<li><span class="summary-property">Label:</span> <span class="summary-value">${escapeHtml(formData.release.labelName) || 'N/A'}</span></li>`;
        releaseHtml += `<li><span class="summary-property">Genre:</span> <span class="summary-value">${escapeHtml(formData.release.genre) || 'N/A'}</span></li>`;
        releaseHtml += `<li><span class="summary-property">Release Date:</span> <span class="summary-value">${formatDate(formData.release.releaseDate)}</span></li>`;
        if (formData.release.isReRelease && formData.release.originalReleaseDate) releaseHtml += `<li><span class="summary-property">Original Release Date:</span> <span class="summary-value">${formatDate(formData.release.originalReleaseDate)}</span></li>`;
        if (formData.release.artworkFileName) {
            releaseHtml += `<li><span class="summary-property">Artwork File:</span> <span class="summary-value">${escapeHtml(formData.release.artworkFileName)}</span></li>`;
        }
        releaseHtml += `<li><span class="summary-property">Number of Tracks:</span> <span class="summary-value">${formData.tracks.length}</span></li></ul>`;
        releaseSummary.innerHTML = releaseHtml;
        summary.appendChild(releaseSummary);

        // --- Track Summary Section ---
        const tracksSummary = document.createElement('div');
        tracksSummary.className = 'summary-section';
        let tracksHtml = '<h3 class="summary-title">Tracks</h3><ul class="summary-list">';
        if (formData.tracks.length > 0) {
            formData.tracks.forEach(track => {
                let trackDisplay = `<strong>${escapeHtml(track.name) || 'Untitled'}</strong>`;
                if (track.mixVersion) trackDisplay += ` (${escapeHtml(track.mixVersion)})`;
                trackDisplay += ` - ${(track.artists && track.artists.length > 0) ? escapeHtml(track.artists.join(', ')) : 'N/A'}`;
                // Show selected audio filename
                if (track.audioFileName) trackDisplay += `<br><small><em>Audio File: ${escapeHtml(track.audioFileName)}</em></small>`;

                tracksHtml += `<li><span class="summary-property">${track.trackNumber}.</span><span class="summary-value">${trackDisplay}</span></li>`;
            });
        } else {
            tracksHtml += '<li>No tracks added yet.</li>';
        }
        tracksHtml += '</ul>';
        tracksSummary.innerHTML = tracksHtml;
        summary.appendChild(tracksSummary);
    }


    // Function to get array of values from inputs in a container by ID
    function getInputValuesArray(containerId) {
        const container = document.getElementById(containerId);
        return getInputValuesArrayFromElement(container); // Reuse the element-based helper
    }

    // Helper function to get values from a container element
    function getInputValuesArrayFromElement(container) {
        if (!container) return [];
        const inputs = container.querySelectorAll('.artist-input'); // Assuming inputs have this class
        return Array.from(inputs)
            .map(input => input.value.trim()) // Get trimmed value
            .filter(val => val !== ''); // Filter out empty strings
    }

    // Helper function to get contributors data from a container element
    function getContributorsFromContainer(container) {
        if (!container) return [];
        const contributorRows = container.querySelectorAll('.contributor-row');
        return Array.from(contributorRows).map(row => {
            const nameInput = row.querySelector('input.contributor-name-field');
            const roleTags = row.querySelectorAll('.role-tag');
            const roles = Array.from(roleTags).map(tag => tag.dataset.role); // Get roles from data attribute
            return {
                name: nameInput ? nameInput.value.trim() : '',
                roles: roles
            };
        }).filter(c => c.name || (c.roles && c.roles.length > 0)); // Keep if name OR roles exist
    }

    // Function to validate release form
    function validateReleaseForm() {
        let isValid = true;
        const fields = [
            { id: 'releaseTitle', message: 'Please enter a Release Title' },
            { id: 'releaseDate', message: 'Please enter a Release Date' },
            { id: 'labelName', message: 'Please enter a Label Name' },
            { id: 'albumGenre', message: 'Please select an Album Genre' },
            { id: 'albumCLine', message: 'Please enter an ALBUM C LINE' },
            { id: 'albumPLine', message: 'Please enter an ALBUM P LINE' },
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element && !element.value) {
                alert(field.message);
                element.focus();
                isValid = false;
                return; // Exit loop early if invalid
            }
        });
        if (!isValid) return false;

        // Artist validation
        const artistContainer = document.getElementById('artist-container');
        const artists = getInputValuesArray('artist-container');
        if (artists.length === 0 || artists.some(a => !a)) { // Check for empty strings too
            alert('Please enter at least one valid Release Artist');
            const firstEmptyArtist = artistContainer ? Array.from(artistContainer.querySelectorAll('.artist-input')).find(input => !input.value.trim()) : null;
            if (firstEmptyArtist) firstEmptyArtist.focus();
            else if (artistContainer?.querySelector('.artist-input')) artistContainer.querySelector('.artist-input').focus(); // Focus first if none are empty but list is empty
            return false;
        }

        // Original Release Date validation (if re-release)
        const isReReleaseChecked = document.getElementById('isReRelease').checked;
        const originalReleaseDateInput = document.getElementById('originalReleaseDate');
        if (isReReleaseChecked && originalReleaseDateInput && !originalReleaseDateInput.value) {
            alert('Please enter the Original Release Date since this is marked as a re-release.');
            originalReleaseDateInput.focus();
            return false;
        }

        // Note: Artwork is optional, so no validation needed here unless required by user later
        return true;
     }

    // Function to validate tracks form
    function validateTracksForm() {
        const trackModules = document.querySelectorAll('.track-module');
        let allValid = true;
        if (trackModules.length === 0) {
            alert('Please add at least one track.');
            return false;
        }

        for (const [index, module] of trackModules.entries()) { // Use for...of for early exit
            const trackNum = index + 1;

            // Required simple fields
            const simpleFields = [
                { query: `input[id^="trackName"]`, message: `Track ${trackNum}: Please enter a Track Title` },
                { query: `select[id^="trackGenre"]`, message: `Track ${trackNum}: Please select a Track Genre` },
                { query: `select[id^="trackLanguage"]`, message: `Track ${trackNum}: Please select a Language` },
            ];

            for (const field of simpleFields) {
                const element = module.querySelector(field.query);
                if (!element || !element.value) {
                    alert(field.message);
                    if(element) element.focus();
                    allValid = false;
                    break; // Exit inner loop
                }
            }
            if (!allValid) break; // Exit outer loop

            // Track Artist validation
            const artistContainer = module.querySelector(`div[id^="track-artist-container"]`);
            const artists = getInputValuesArrayFromElement(artistContainer);
            if (artists.length === 0 || artists.some(a => !a)) {
                alert(`Track ${trackNum}: Please enter at least one valid Track Artist`);
                const firstEmptyArtist = artistContainer ? Array.from(artistContainer.querySelectorAll('.artist-input')).find(input => !input.value.trim()) : null;
                if(firstEmptyArtist) firstEmptyArtist.focus();
                else if (artistContainer?.querySelector('.artist-input')) artistContainer.querySelector('.artist-input').focus();
                allValid = false;
                break; // Exit outer loop
            }

            // Performer validation (at least one with name and role)
            const performerContainer = module.querySelector(`div[id^="track-performer-container"]`);
            const performers = getContributorsFromContainer(performerContainer);
            let hasValidPerformer = false;
            if (performers && performers.length > 0) {
                hasValidPerformer = performers.some(p => p.name && p.roles && p.roles.length > 0);
            }
            if (!hasValidPerformer) {
                alert(`Track ${trackNum}: Please add at least one performer with a name and at least one role.`);
                const firstEmptyPerformerName = performerContainer ? Array.from(performerContainer.querySelectorAll('.contributor-name-field')).find(input => !input.value.trim()) : null;
                if(firstEmptyPerformerName) {
                    firstEmptyPerformerName.focus();
                } else {
                    const firstPerformerName = performerContainer?.querySelector('.contributor-name-field');
                    if (firstPerformerName) firstPerformerName.focus();
                    else { // If no name fields exist yet, focus the add button
                        const addPerformerBtn = performerContainer?.nextElementSibling; // Assuming button is next sibling
                        if(addPerformerBtn) addPerformerBtn.focus();
                    }
                }
                allValid = false;
                break; // Exit outer loop
            }
             // Note: Audio file is optional, no validation needed unless required later
        }
        return allValid;
    }


    // Function to export form data and audio files to ZIP
    function exportToZip() {
        // Check for library dependencies
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
             alert('Error: Required export libraries (JSZip, FileSaver) not loaded.');
             return;
        }

        const exportButton = document.getElementById('export-zip-btn');
        const statusDiv = document.getElementById('export-status');

        // Disable button and show status
        if(exportButton) exportButton.disabled = true;
        if(statusDiv) {
            statusDiv.textContent = 'Preparing data...';
            statusDiv.style.display = 'block';
        }

        try {
            // 1. Generate CSV Content String
            if(statusDiv) statusDiv.textContent = 'Generating CSV data...';
            // Define CSV Headers (adjust as per exact requirements)
            const headers = [
                'Title Type', 'Release Title', 'Release Mix/Version', 'Release Artist', 'Release Featured Artist', 'Album Remixer',
                'Label Name', 'Album Genre', 'Cat Number', 'UPC (barcode)', 'Release Date', 'Original Release Date',
                'ALBUM C LINE', 'ALBUM P LINE', 'Territory', 'Excluded Territory',
                'Disc Number', 'Track Number', 'Track Title', 'Mix Version', 'Track Artist', 'Track featured Artist', 'Remixer',
                'Performer Roles (At Least 1 Name Required Per Track)', 'Songwriter (At Least 1 Name Required Per Track)', 'Production/Engineering (At Least 1 Name Required Per Track)',
                'Track Genre', 'ISRC code', 'Secondary ISRC code', 'Language', 'Publisher', 'Explict Content', 'Lyrics',
                'Audio Filename', 'Artwork Filename' // Added Artwork Filename header
            ];
            let csvContent = headers.map(escapeCsvField).join(',') + '\n'; // Header row

            // Prepare release-level data once
            const releaseArtists = formData.release.artists ? formData.release.artists.join('|') : '';
            const releaseFeaturedArtists = formData.release.featuredArtists ? formData.release.featuredArtists.join('|') : '';
            const releaseRemixers = formData.release.remixers ? formData.release.remixers.join('|') : '';
            let includedTerritories = '';
            let excludedTerritories = '';
            if (formData.release.isWorldwide) {
                includedTerritories = 'Worldwide';
            } else if (formData.release.territories && formData.release.territories.codes.length > 0) {
                if (formData.release.territories.mode === 'include') {
                    includedTerritories = formData.release.territories.codes.join(',');
                } else {
                    excludedTerritories = formData.release.territories.codes.join(',');
                }
            }

            // Add a row for each track
            formData.tracks.forEach((track, index) => {
                const trackArtists = track.artists ? track.artists.join('|') : '';
                const trackFeaturedArtists = track.featuredArtists ? track.featuredArtists.join('|') : '';
                const trackRemixers = track.remixers ? track.remixers.join('|') : '';
                const trackPublishers = track.publishers ? track.publishers.join('|') : '';
                const trackPerformers = formatContributors(track.performers);
                const trackComposition = formatContributors(track.composition);
                const trackProduction = formatContributors(track.production);

                // Include artwork filename only on the first track's row for simplicity in CSV
                const artworkFilenameForCSV = (index === 0) ? formData.release.artworkFileName : '';

                const rowData = [
                    escapeCsvField(formData.release.titleType), // Assuming titleType exists, else add it to formData
                    escapeCsvField(formData.release.title),
                    escapeCsvField(formData.release.mixVersion),
                    escapeCsvField(releaseArtists),
                    escapeCsvField(releaseFeaturedArtists),
                    escapeCsvField(releaseRemixers),
                    escapeCsvField(formData.release.labelName),
                    escapeCsvField(formData.release.genre),
                    escapeCsvField(formData.release.catNumber),
                    escapeCsvField(formData.release.upc),
                    escapeCsvField(formData.release.releaseDate),
                    escapeCsvField(formData.release.originalReleaseDate),
                    escapeCsvField(formData.release.cLine),
                    escapeCsvField(formData.release.pLine),
                    escapeCsvField(includedTerritories),
                    escapeCsvField(excludedTerritories),
                    escapeCsvField(track.discNumber),
                    escapeCsvField(track.trackNumber),
                    escapeCsvField(track.name),
                    escapeCsvField(track.mixVersion),
                    escapeCsvField(trackArtists),
                    escapeCsvField(trackFeaturedArtists),
                    escapeCsvField(trackRemixers),
                    escapeCsvField(trackPerformers),
                    escapeCsvField(trackComposition),
                    escapeCsvField(trackProduction),
                    escapeCsvField(track.genre),
                    escapeCsvField(track.isrc),
                    escapeCsvField(track.secondaryIsrc),
                    escapeCsvField(track.language),
                    escapeCsvField(trackPublishers),
                    escapeCsvField(track.explicit),
                    escapeCsvField(track.lyrics),
                    escapeCsvField(track.audioFileName), // Add audio filename
                    escapeCsvField(artworkFilenameForCSV) // Add artwork filename
                ];
                csvContent += rowData.join(',') + '\n';
            });

            // 2. Initialize JSZip
            const zip = new JSZip();

            // 3. Add CSV to Zip
            zip.file("metadata.csv", csvContent);

            // 4. Add Artwork File to Zip (root level) if it exists
            if (formData.release.artworkFileObject instanceof File) {
                if(statusDiv) statusDiv.textContent = 'Adding artwork...';
                const safeArtworkName = sanitizeFilename(formData.release.artworkFileObject.name);
                zip.file(safeArtworkName, formData.release.artworkFileObject);
            }

            // 5. Add Audio Files to Zip (in an 'audio' folder)
            const audioFolder = zip.folder("audio");
            let audioFilesToAdd = 0;
            formData.tracks.forEach(track => {
                if (track.audioFileObject instanceof File) { // Check if it's a valid File object
                    audioFilesToAdd++;
                }
            });

            if (audioFilesToAdd > 0) {
                 if(statusDiv) statusDiv.textContent = `Adding ${audioFilesToAdd} audio file(s)...`;
                 formData.tracks.forEach(track => {
                     if (track.audioFileObject instanceof File) {
                         const trackNumberPrefix = String(track.trackNumber).padStart(2, '0');
                         const safeFileName = sanitizeFilename(track.audioFileObject.name);
                         const zipFileName = `${trackNumberPrefix}_${safeFileName}`;
                         audioFolder.file(zipFileName, track.audioFileObject);
                     }
                 });
            } else {
                 if(statusDiv) statusDiv.textContent = 'No audio files to add. Preparing ZIP...';
            }


            // 6. Generate Zip file asynchronously
            if(statusDiv) statusDiv.textContent = 'Compressing files... (This may take a moment)';
            zip.generateAsync({
                type: "blob" ,
                compression: "DEFLATE", // Standard zip compression
                compressionOptions: {
                    level: 6 // Balance between speed and compression (1=fastest, 9=best)
                }
            }, function updateCallback(metadata) {
                 // Optional: Update progress indicator during compression
                 if (statusDiv && metadata.percent) {
                    statusDiv.textContent = `Compressing... ${metadata.percent.toFixed(0)}%`;
                 }
            })
            .then(function(blob) {
                // 7. Trigger Download using FileSaver.js
                const safeReleaseTitle = sanitizeFilename(formData.release.title || 'release', true); // Sanitize for filename
                const zipFilename = `release_export_${safeReleaseTitle}.zip`;
                saveAs(blob, zipFilename);
                if(statusDiv) statusDiv.textContent = 'Export complete! Check your downloads.';
            })
            .catch(function (err) {
                console.error("Error generating ZIP file:", err);
                alert("Error generating ZIP file: " + err.message);
                if(statusDiv) statusDiv.textContent = 'Error generating ZIP file.';
            })
            .finally(function () {
                 // Re-enable button regardless of success or failure
                 if(exportButton) exportButton.disabled = false;
                 // Optionally hide status after a delay
                 setTimeout(() => {
                    if(statusDiv && statusDiv.textContent.includes('complete')) { // Only hide if successful
                        statusDiv.style.display = 'none';
                    }
                 }, 5000); // Hide after 5 seconds
            });

        } catch (error) {
            console.error('Export error:', error);
            alert('An unexpected error occurred during export: ' + error.message);
            if(exportButton) exportButton.disabled = false; // Re-enable button on unexpected error
            if(statusDiv) {
                 statusDiv.textContent = 'An unexpected export error occurred.';
                 statusDiv.style.display = 'block';
            }
        }
    }


    // Helper function to format contributors for CSV (Name (Role1, Role2)|Name2 (Role3)...)
    function formatContributors(contributors) {
        if (!contributors || !Array.isArray(contributors) || contributors.length === 0) return '';
        return contributors
            .filter(c => c.name && c.name.trim() !== '') // Ensure contributor has a name
            .map(c => {
                const namePart = c.name.trim();
                const rolesString = (c.roles && c.roles.length > 0) ? ` (${c.roles.join(', ')})` : ''; // Add roles in parentheses
                return `${namePart}${rolesString}`;
            })
            .join('|'); // Separate contributors with a pipe
    }

    // Helper function to escape CSV fields (handle quotes, commas, newlines)
    function escapeCsvField(field) {
        if (field === undefined || field === null) return ''; // Handle null/undefined
        const stringField = String(field); // Convert to string
        // If the field contains a comma, newline, or double quote, enclose it in double quotes
        if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            // Escape existing double quotes by doubling them and wrap the whole field in quotes
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField; // Return the field as is if no special characters
    }

    // Helper function to sanitize filenames
    function sanitizeFilename(filename, replaceSpaces = false) {
        if (typeof filename !== 'string') return 'invalid_filename';
        // Remove potentially problematic characters, keep basic alphanumeric, underscore, hyphen, dot
        let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Optionally replace spaces with underscores
        if (replaceSpaces) {
            sanitized = sanitized.replace(/\s+/g, '_');
        }
        // Prevent filenames starting with a dot or being excessively long
        if (sanitized.startsWith('.')) {
            sanitized = '_' + sanitized.substring(1);
        }
        return sanitized.substring(0, 100); // Limit length
    }


    // Set up territory management UI
    function setupTerritoryManagement() {
        const dropdown = document.getElementById('territory-dropdown');
        const tagsContainer = document.getElementById('territory-tags');
        const territoriesDataInput = document.getElementById('territories-data');
        const territoriesModeInput = document.getElementById('territories-mode');
        const modeToggle = document.getElementById('territory-mode-toggle');
        const modeText = document.getElementById('territory-mode-text');
        const worldwideToggle = document.getElementById('worldwide-toggle');
        const worldwideText = document.getElementById('worldwide-text');
        const isWorldwideInput = document.getElementById('is-worldwide');
        const territoriesSection = document.getElementById('territories-section');

        if (!dropdown || !tagsContainer || !territoriesDataInput || !territoriesModeInput || !modeToggle || !modeText || !worldwideToggle || !worldwideText || !isWorldwideInput || !territoriesSection) {
            console.error("One or more territory management elements not found.");
            return;
        }

        let territories = []; // Array to hold { code: 'XX', name: 'Country Name' } objects
        let territoryMode = 'include'; // 'include' or 'exclude'

        // --- Event Listeners ---
        worldwideToggle.addEventListener('change', handleWorldwideChange);
        modeToggle.addEventListener('change', handleModeChange);
        dropdown.addEventListener('change', handleDropdownChange);
        tagsContainer.addEventListener('click', handleTagRemove); // Use event delegation for remove buttons

        // --- Initialization ---
        initializeTerritoryState();

        // --- Handler Functions ---
        function handleWorldwideChange() {
            const isWorldwide = worldwideToggle.checked;
            worldwideText.textContent = isWorldwide ? 'Yes' : 'No';
            isWorldwideInput.value = isWorldwide.toString();
            territoriesSection.style.display = isWorldwide ? 'none' : 'block';
            if (isWorldwide) {
                clearTerritories(); // Clear selections if switching to worldwide
            } else {
                // If switching away from worldwide and no territories selected, default to include mode
                if (territories.length === 0) {
                    territoryMode = 'include';
                    modeToggle.checked = false; // Ensure toggle reflects 'include'
                    updateModeAppearance();
                }
            }
            updateTerritoriesData();
        }

        function handleModeChange() {
            territoryMode = modeToggle.checked ? 'exclude' : 'include';
            updateModeAppearance();
            updateTerritoriesData();
        }

        function handleDropdownChange() {
            if (dropdown.value) {
                const selectedOption = dropdown.options[dropdown.selectedIndex];
                addTerritoryTag(dropdown.value, selectedOption.text.split(' (')[0]); // Extract name before code
                dropdown.value = ''; // Reset dropdown
            }
        }

        function handleTagRemove(event) {
            if (event.target.classList.contains('remove-tag')) {
                const tagElement = event.target.closest('.territory-tag');
                if (tagElement && tagElement.dataset.code) {
                    removeTerritoryTag(tagElement.dataset.code, tagElement);
                }
            }
        }

        // --- Core Logic Functions ---
        function addTerritoryTag(code, name) {
            if (territories.some(t => t.code === code)) {
                alert(`${name} (${code}) is already in the list.`);
                return;
            }
            territories.push({ code: code, name: name });
            updateTerritoriesData();
            renderTag(code, name);
        }

        function removeTerritoryTag(code, tagElement) {
            territories = territories.filter(t => t.code !== code);
            updateTerritoriesData();
            // Animate removal
            tagElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            tagElement.style.opacity = '0';
            tagElement.style.transform = 'scale(0.8)';
            setTimeout(() => {
                tagElement.remove();
            }, 300);
        }

        function renderTag(code, name) {
            const tag = document.createElement('div');
            tag.className = `territory-tag ${territoryMode}-mode`;
            tag.dataset.code = code;

            const label = document.createElement('span');
            label.textContent = `${name} (${code})`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-tag';
            removeBtn.innerHTML = '&times;'; // Use times symbol for remove
            removeBtn.setAttribute('aria-label', `Remove ${name}`);

            tag.appendChild(label);
            tag.appendChild(removeBtn);

            // Animate addition
            tag.style.opacity = '0';
            tag.style.transform = 'scale(0.8)';
            tag.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            tagsContainer.appendChild(tag);
            // Trigger reflow before animating in
            tag.offsetHeight;
            tag.style.opacity = '1';
            tag.style.transform = 'scale(1)';
        }

        function clearTerritories() {
            territories = [];
            tagsContainer.innerHTML = ''; // Clear visually
            updateTerritoriesData();
        }

        function updateTerritoriesData() {
            territoriesDataInput.value = JSON.stringify(territories);
            territoriesModeInput.value = territoryMode;
        }

        function updateModeAppearance() {
            tagsContainer.className = `territory-tags ${territoryMode}-mode`;
            // Update existing tags' classes
            tagsContainer.querySelectorAll('.territory-tag').forEach(tag => {
                tag.className = `territory-tag ${territoryMode}-mode`;
            });
            // Update label text and color
            modeText.textContent = territoryMode === 'include' ? 'Included Territories' : 'Excluded Territories';
            modeText.style.color = territoryMode === 'include' ? 'var(--primary-color)' : 'var(--danger-color)';
        }

        function initializeTerritoryState() {
            // Set initial state based on HTML values (e.g., if form is reloaded with data)
            territoryMode = territoriesModeInput.value || 'include';
            modeToggle.checked = (territoryMode === 'exclude');
            worldwideToggle.checked = (isWorldwideInput.value === 'true');

            try {
                territories = JSON.parse(territoriesDataInput.value || '[]');
            } catch (e) {
                console.error("Error parsing initial territories data:", e);
                territories = [];
            }

            // Initial UI setup
            handleWorldwideChange(); // Set visibility based on worldwide toggle
            updateModeAppearance(); // Set mode text/colors
            tagsContainer.innerHTML = ''; // Clear any static tags
            territories.forEach(t => renderTag(t.code, t.name)); // Render initial tags
        }
    }


    // --- Artist/Contributor Setup Functions (Generic Helpers) ---

    // Adds/Removes artist input rows for required fields (e.g., Release Artist)
    function setupArtistMechanism(containerId, inputName, isRequired) {
        const container = document.getElementById(containerId);
        if (!container) { console.error(`Container not found: ${containerId}`); return; }

        // Ensure at least one row exists on init
        if (container.children.length === 0) {
            addArtistRow(container, inputName, isRequired);
        } else {
            // Update existing rows (e.g., ensure buttons are correct)
            updateArtistRows(container, inputName, isRequired);
        }
    }

    // Adds/Removes artist input rows for optional fields triggered by a button
    function setupOtherArtistMechanism(containerId, inputName, buttonId) {
        const container = document.getElementById(containerId);
        const addButton = document.getElementById(buttonId);
        if (!container || !addButton) { console.error(`Optional artist container or button not found: ${containerId}/${buttonId}`); return; }

        // Add listener to the main 'Add Section' button
        if (!addButton.hasAttribute('data-optional-listener')) {
            addButton.addEventListener('click', function() {
                container.style.display = 'block'; // Show the container
                addButton.style.display = 'none'; // Hide the initial add button
                // Add the first input row only if the container is empty
                if (container.querySelectorAll('.artist-row').length === 0) {
                    addOptionalArtistRow(container, inputName, buttonId);
                }
            });
            addButton.setAttribute('data-optional-listener', 'true');
        }

        // If rows already exist (e.g., prefilled data), ensure buttons are correct
        if (container.querySelectorAll('.artist-row').length > 0) {
             updateOptionalArtistRows(container, inputName, buttonId);
             container.style.display = 'block'; // Ensure container is visible
             addButton.style.display = 'none'; // Hide initial add button
        } else {
            container.style.display = 'none'; // Hide if empty
            addButton.style.display = 'inline-flex'; // Show add button if empty
        }
    }

    // --- Artist Row Creation/Update (Internal Helpers) ---

    // Adds a single artist row (for required or optional sections)
    function addArtistRow(container, inputName, isRequired) {
        const row = createArtistRowElement(inputName, isRequired);
        container.appendChild(row);
        updateArtistRows(container, inputName, isRequired); // Update buttons for all rows
        row.querySelector('.artist-input').focus(); // Focus the new input
    }

    // Adds a single artist row specifically for optional sections
    function addOptionalArtistRow(container, inputName, buttonId) {
        const row = createArtistRowElement(inputName, false); // Optional rows are not required
        container.appendChild(row);
        updateOptionalArtistRows(container, inputName, buttonId); // Update buttons
        row.querySelector('.artist-input').focus(); // Focus the new input
    }

    // Creates the HTML elements for an artist row
    function createArtistRowElement(inputName, isRequired) {
        const row = document.createElement('div');
        row.className = 'artist-row'; // Add animation class later if needed

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control artist-input';
        input.name = inputName;
        input.required = isRequired; // Set required attribute based on param

        const actions = document.createElement('div');
        actions.className = 'artist-actions';

        row.appendChild(input);
        row.appendChild(actions);
        return row;
    }

    // Updates the Add/Remove buttons for all rows in a REQUIRED artist container
    function updateArtistRows(container, inputName, isRequired) {
        const rows = container.querySelectorAll('.artist-row');
        rows.forEach((row, index) => {
            const actions = row.querySelector('.artist-actions');
            if (!actions) return;
            actions.innerHTML = ''; // Clear existing buttons

            // Add Remove button if more than one row exists
            if (rows.length > 1) {
                const removeBtn = createArtistRemoveButton(row, () => updateArtistRows(container, inputName, isRequired));
                actions.appendChild(removeBtn);
            }

            // Add Add button only to the last row
            if (index === rows.length - 1) {
                const addBtn = createArtistAddButton(() => addArtistRow(container, inputName, isRequired));
                actions.appendChild(addBtn);
            }

            // Ensure input required status is correct (especially for the first row)
            const inputField = row.querySelector('.artist-input');
            if (inputField) inputField.required = isRequired;
        });

        // Special check: ensure the very first input is required if the section is required
        if (isRequired && rows.length > 0) {
            const firstInput = rows[0].querySelector('.artist-input');
            if (firstInput) firstInput.required = true;
        }
    }

    // Updates the Add/Remove buttons for all rows in an OPTIONAL artist container
    function updateOptionalArtistRows(container, inputName, buttonId) {
        const rows = container.querySelectorAll('.artist-row');
        const originalAddButton = document.getElementById(buttonId);

        rows.forEach((row, index) => {
            const actions = row.querySelector('.artist-actions');
            if (!actions) return;
            actions.innerHTML = ''; // Clear existing buttons

            // Always add a Remove button for optional rows
            const removeBtn = createArtistRemoveButton(row, () => {
                // After removing, check if container is now empty
                if (container.querySelectorAll('.artist-row').length === 0) {
                    container.style.display = 'none'; // Hide container
                    if (originalAddButton) originalAddButton.style.display = 'inline-flex'; // Show original add button
                } else {
                    updateOptionalArtistRows(container, inputName, buttonId); // Update remaining rows
                }
            });
            actions.appendChild(removeBtn);

            // Add Add button only to the last row
            if (index === rows.length - 1) {
                const addBtn = createArtistAddButton(() => addOptionalArtistRow(container, inputName, buttonId));
                actions.appendChild(addBtn);
            }
        });
    }

    // Creates the Add (+) button element
    function createArtistAddButton(onClickAction) {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn btn-icon btn-success';
        addBtn.innerHTML = '+';
        addBtn.setAttribute('aria-label', 'Add another artist');
        addBtn.addEventListener('click', onClickAction);
        return addBtn;
    }

    // Creates the Remove (x) button element
    function createArtistRemoveButton(rowToRemove, afterRemoveCallback) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-icon btn-danger';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('aria-label', 'Remove artist');
        removeBtn.addEventListener('click', function() {
            // Optional: Add fade-out animation
            rowToRemove.style.transition = 'opacity 0.3s ease';
            rowToRemove.style.opacity = '0';
            setTimeout(() => {
                rowToRemove.remove();
                afterRemoveCallback(); // Update buttons after removal
            }, 300);
        });
        return removeBtn;
    }


    // --- Contributor Setup ---
    function setupContributorContainer(containerId, inputNamePrefix, contributorType) {
        const container = document.getElementById(containerId);
        if (!container) { console.error(`Contributor container not found: ${containerId}`); return; }

        const isPerformer = (contributorType === 'performer'); // Performers are required

        // Ensure at least one row exists if it's for performers
        if (isPerformer && container.querySelectorAll('.contributor-row').length === 0) {
            addContributor(container, inputNamePrefix, contributorType);
        } else {
            // Update indices and buttons for existing rows
            updateContributorIndices(container, inputNamePrefix, contributorType);
        }

        // Set up the "Add Contributor" button for this section
        const addButton = document.querySelector(`.add-contributor-btn[data-container="${containerId}"]`);
        if (addButton && !addButton.hasAttribute('data-contributor-listener')) {
            addButton.addEventListener('click', function() {
                addContributor(container, inputNamePrefix, contributorType);
            });
            addButton.setAttribute('data-contributor-listener', 'true');
        }
    }

    // Adds a contributor row
    function addContributor(container, inputNamePrefix, contributorType) {
        const index = container.querySelectorAll('.contributor-row').length;
        const isPerformer = (contributorType === 'performer');
        const row = document.createElement('div');
        row.className = 'contributor-row';

        // Name Input Field
        const nameFieldDiv = document.createElement('div');
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-control contributor-name-field';
        nameInput.name = `${inputNamePrefix}[${index}][name]`;
        nameInput.placeholder = `Enter ${contributorType} name`;
        nameInput.required = isPerformer; // Name is required only for performers
        nameFieldDiv.appendChild(nameInput);

        // Role Selector Dropdown
        const roleSelectorDiv = document.createElement('div');
        const roleSelect = document.createElement('select');
        roleSelect.className = 'form-control';
        roleSelect.innerHTML = `<option value="">Add Role...</option>`;
        if (availableRoles[contributorType]) {
            availableRoles[contributorType].forEach(role => {
                roleSelect.innerHTML += `<option value="${role}">${role}</option>`;
            });
        } else {
            console.warn(`No roles defined for contributor type: ${contributorType}`);
        }
        roleSelectorDiv.appendChild(roleSelect);

        // Container for Role Tags
        const rolesContainer = document.createElement('div');
        rolesContainer.className = 'contributor-roles';

        // Remove Button Container
        const removeButtonDiv = document.createElement('div');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        // Use secondary style for required performer remove unless it's the only one
        removeBtn.className = `btn btn-sm ${isPerformer ? 'btn-outline-secondary' : 'btn-danger'} remove-contributor-btn`;
        removeBtn.innerHTML = 'Remove';
        removeBtn.setAttribute('aria-label', `Remove ${contributorType}`);
        removeButtonDiv.appendChild(removeBtn);

        // Event listener for role selection
        roleSelect.addEventListener('change', function() {
            if (roleSelect.value) {
                addRoleTag(rolesContainer, roleSelect.value, `${inputNamePrefix}[${index}][roles][]`);
                roleSelect.value = ''; // Reset dropdown
            }
        });

        // Event listener for removing the contributor row
        removeBtn.addEventListener('click', function() {
            // Allow removal if not a performer OR if it's a performer but not the last one
            if (!isPerformer || container.querySelectorAll('.contributor-row').length > 1) {
                row.style.transition = 'opacity 0.3s ease';
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                    updateContributorIndices(container, inputNamePrefix, contributorType); // Update remaining rows
                }, 300);
            } else {
                alert(`At least one ${contributorType} is required for this track.`);
            }
        });

        // Assemble the row
        row.appendChild(nameFieldDiv);
        row.appendChild(roleSelectorDiv);
        row.appendChild(rolesContainer);
        row.appendChild(removeButtonDiv);

        // Animate row addition
        row.style.opacity = '0';
        row.style.transition = 'opacity 0.3s ease';
        container.appendChild(row);
        // Trigger reflow before animating in
        row.offsetHeight;
        row.style.opacity = '1';

        nameInput.focus(); // Focus the name input of the new row
        updateContributorIndices(container, inputNamePrefix, contributorType); // Update all buttons/indices
    }

    // Adds a role tag to the roles container
    function addRoleTag(container, role, inputName) {
        // Check if role already exists
        const existingRoles = Array.from(container.querySelectorAll('.role-tag')).map(t => t.dataset.role);
        if (existingRoles.includes(role)) {
            alert(`${role} role already added.`);
            return;
        }

        const tag = document.createElement('div');
        tag.className = 'role-tag';
        tag.dataset.role = role; // Store role in data attribute

        // Hidden input to store the role value for form submission
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = inputName; // e.g., tracks[0][performers][0][roles][]
        input.value = role;

        const text = document.createElement('span');
        text.textContent = role;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-role';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('aria-label', `Remove ${role} role`);
        removeBtn.addEventListener('click', function() {
            // Animate removal
            tag.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            tag.style.opacity = '0';
            tag.style.transform = 'scale(0.8)';
            setTimeout(() => {
                tag.remove();
            }, 300);
        });

        tag.appendChild(text);
        tag.appendChild(input);
        tag.appendChild(removeBtn);

        // Animate addition
        tag.style.opacity = '0';
        tag.style.transform = 'scale(0.8)';
        tag.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.appendChild(tag);
        // Trigger reflow
        tag.offsetHeight;
        tag.style.opacity = '1';
        tag.style.transform = 'scale(1)';
    }

    // Updates indices and button states for contributor rows
    function updateContributorIndices(container, inputNamePrefix, contributorType) {
        const rows = container.querySelectorAll('.contributor-row');
        const isPerformer = (contributorType === 'performer');

        rows.forEach((row, index) => {
            // Update name attributes for inputs based on new index
            const nameInput = row.querySelector('.contributor-name-field');
            if (nameInput) {
                nameInput.name = `${inputNamePrefix}[${index}][name]`;
                nameInput.required = isPerformer; // Re-apply required if performer
            }

            const roleInputs = row.querySelectorAll('.role-tag input[type="hidden"]');
            roleInputs.forEach(input => {
                input.name = `${inputNamePrefix}[${index}][roles][]`;
            });

            // Update remove button appearance/state
            const removeBtn = row.querySelector('.remove-contributor-btn');
            if (removeBtn) {
                if (isPerformer && rows.length === 1) {
                    // If it's the only performer row, make remove button less prominent/disabled visually
                    removeBtn.classList.remove('btn-danger');
                    removeBtn.classList.add('btn-outline-secondary');
                    // Optionally disable it: removeBtn.disabled = true;
                } else {
                    // Otherwise, ensure it's the standard remove style
                    removeBtn.classList.remove('btn-outline-secondary');
                    removeBtn.classList.add(isPerformer ? 'btn-outline-secondary' : 'btn-danger'); // Keep secondary for performers unless last
                    // removeBtn.disabled = false;
                }
            }
        });
    }


    // --- Track Creation and Management Functions ---

    /**
     * Creates a new track module element and appends it to the container.
     * @param {object} options - Configuration options.
     * @param {boolean} [options.isRemovable=true] - Whether the track can be removed.
     * @param {object|null} [options.prefillData=null] - Data to prefill the track with.
     * @param {boolean} [options.animateIn=true] - Whether to animate the module appearance.
     * @returns {HTMLElement} The created track module element.
     */
    function createTrack(options = {}) {
        // Default options
        const { isRemovable = true, prefillData = null, animateIn = true } = options;

        // Calculate indices
        const trackModules = document.querySelectorAll('.track-module');
        const currentTrackCount = trackModules.length;
        const actualIndex = currentTrackCount + 1; // 1-based index for display and IDs
        const zeroBasedIndex = currentTrackCount; // 0-based index for array names

        // --- Create Track Module Elements ---
        const trackModule = document.createElement('div');
        // Start expanded by default. Add 'collapsed' to start minimized.
        trackModule.className = 'track-module';
        trackModule.id = `track-${actualIndex}`;
        if (animateIn) {
            trackModule.style.opacity = '0';
            trackModule.style.transition = 'opacity 0.4s ease-in-out';
        }

        // Track Header (Accordion Toggle)
        const trackHeader = document.createElement('div');
        trackHeader.className = 'track-header accordion-toggle'; // Class to identify toggle
        trackHeader.setAttribute('role', 'button'); // Accessibility: behaves like a button
        trackHeader.setAttribute('aria-expanded', 'true'); // Initial state: expanded
        trackHeader.setAttribute('aria-controls', `track-body-${actualIndex}`); // Links to the body
        trackHeader.tabIndex = 0; // Make it focusable via keyboard

        // Track Number Display
        const trackNumberDiv = document.createElement('div');
        trackNumberDiv.className = 'track-number';
        trackNumberDiv.textContent = `Track ${actualIndex}`;
        trackHeader.appendChild(trackNumberDiv);

        // Accordion Icon (+/-)
        const iconContainer = document.createElement('div');
        iconContainer.className = 'accordion-icon';
        iconContainer.innerHTML = '-'; // Initial icon for expanded state (-)
        trackHeader.appendChild(iconContainer);

        // Container for the Remove Track Button (added dynamically later)
        const removeButtonContainer = document.createElement('div');
        removeButtonContainer.className = 'remove-track-button-container';
        // IMPORTANT: Append remove container *before* the icon if icon is positioned absolutely right
        trackHeader.appendChild(removeButtonContainer);

        // Track Body (Content Area)
        const trackBody = document.createElement('div');
        trackBody.className = 'track-body';
        trackBody.id = `track-body-${actualIndex}`; // ID for aria-controls

        // --- Populate Track Body with Form Fields ---
        // (Keep the existing innerHTML structure)
        trackBody.innerHTML = `
            <div class="form-group"> <label for="trackName${actualIndex}" class="form-label required">Track Title</label> <input type="text" id="trackName${actualIndex}" name="tracks[${zeroBasedIndex}][name]" class="form-control" required> </div>
            <div class="form-group" id="trackMixVersionContainer${actualIndex}" style="display: none;"> <label for="trackMixVersion${actualIndex}" class="form-label">Track Mix/Version</label> <div style="display: flex; align-items: center; gap: 0.5rem;"> <input type="text" id="trackMixVersion${actualIndex}" name="tracks[${zeroBasedIndex}][mixVersion]" class="form-control" placeholder="e.g. Radio Edit, Extended Mix"> <button type="button" class="btn btn-icon btn-outline remove-track-mix-version-btn" data-index="${actualIndex}" aria-label="Remove mix version">×</button> </div> </div>
            <div class="mb-4"> <button type="button" class="btn btn-sm btn-outline add-track-mix-version-btn" data-index="${actualIndex}"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Mix/Version </button> </div>
            <div class="form-group"> <label for="trackAudioFile${actualIndex}" class="form-label">Audio File</label> <input type="file" id="trackAudioFile${actualIndex}" name="tracks[${zeroBasedIndex}][audioFile]" class="form-control file-input" accept="audio/*" data-display-target="trackAudioFileNameDisplay${actualIndex}"> <label for="trackAudioFile${actualIndex}" class="btn btn-outline btn-sm"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Choose File... </label> <span class="file-name-display" id="trackAudioFileNameDisplay${actualIndex}">No file selected</span> <span class="form-hint">Select the audio file for this track (e.g., WAV, FLAC, MP3).</span> </div>
            <div class="form-group"> <label class="form-label required">Track Artist</label> <div class="artist-container" id="track-artist-container-${actualIndex}"></div> </div>
            <div class="form-group"> <label class="form-label">Track Featured Artist</label> <div class="artist-container" id="track-featured-artist-container-${actualIndex}" style="display: none;"></div> <button type="button" id="add-track-featured-artist-btn-${actualIndex}" class="btn btn-sm btn-outline"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Add Featured Artist </button> </div>
            <div class="form-group"> <label class="form-label">Track Remixer</label> <div class="artist-container" id="track-remixer-container-${actualIndex}" style="display: none;"></div> <button type="button" id="add-track-remixer-btn-${actualIndex}" class="btn btn-sm btn-outline"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Add Remixer </button> </div>
            <div class="form-card mb-4"> <div class="form-card-header"><h3 class="form-card-title">Contributors</h3><p class="form-card-subtitle">Add people who contributed to this track (Performers required)</p></div> <div class="form-card-body"> <div class="form-group"><label class="form-label required">Performers</label><div class="contributor-container" id="track-performer-container-${actualIndex}"></div><button type="button" class="btn btn-sm btn-outline add-contributor-btn" data-container="track-performer-container-${actualIndex}" data-type="performer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg> Add Performer</button></div> <div class="form-group"><label class="form-label">Composition</label><div class="contributor-container" id="track-composition-container-${actualIndex}"></div><button type="button" class="btn btn-sm btn-outline add-contributor-btn" data-container="track-composition-container-${actualIndex}" data-type="composition"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path></svg> Add Composer/Writer</button></div> <div class="form-group"><label class="form-label">Production</label><div class="contributor-container" id="track-production-container-${actualIndex}"></div><button type="button" class="btn btn-sm btn-outline add-contributor-btn" data-container="track-production-container-${actualIndex}" data-type="production"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg> Add Producer/Engineer</button></div> </div> </div>
            <div class="form-group"><label class="form-label">Publisher</label><div class="artist-container" id="track-publisher-container-${actualIndex}"></div></div>
            <div class="form-row"> <div class="form-group"><label for="trackGenre${actualIndex}" class="form-label required">Track Genre</label><select id="trackGenre${actualIndex}" name="tracks[${zeroBasedIndex}][genre]" class="form-control" required><option value="">Select a genre</option><option value="Rock">Rock</option><option value="Pop">Pop</option><option value="Dance">Dance</option><option value="Electronic">Electronic</option><option value="Hip-Hop/Rap">Hip-Hop/Rap</option><option value="R&B/Soul">R&B/Soul</option><option value="Classical">Classical</option><option value="Jazz">Jazz</option><option value="Folk">Folk</option><option value="Country">Country</option><option value="Metal">Metal</option><option value="Blues">Blues</option><option value="Reggae">Reggae</option><option value="Punk">Punk</option><option value="World">World</option><option value="Latin">Latin</option><option value="Indie">Indie</option><option value="Alternative">Alternative</option><option value="Techno">Techno</option><option value="House">House</option></select></div> <div class="form-group"><label for="trackISRC${actualIndex}" class="form-label">ISRC Code</label><input type="text" id="trackISRC${actualIndex}" name="tracks[${zeroBasedIndex}][isrc]" class="form-control" placeholder="e.g. USMC81234567"><span class="form-hint">International Standard Recording Code</span></div> </div>
            <div class="form-row"> <div class="form-group"><label class="form-label checkbox-control"><input type="checkbox" id="trackDolbyAtmos${actualIndex}" name="tracks[${zeroBasedIndex}][dolbyAtmos]" class="track-dolby-atmos-toggle" data-index="${actualIndex}">Track Contains Dolby Atmos</label></div> <div class="form-group secondary-isrc-container" id="trackSecondaryISRCContainer${actualIndex}" style="display: none;"><label for="trackSecondaryISRC${actualIndex}" class="form-label">Secondary ISRC</label><input type="text" id="trackSecondaryISRC${actualIndex}" name="tracks[${zeroBasedIndex}][secondaryIsrc]" class="form-control" placeholder="e.g. USMC81234568"><span class="form-hint">For Dolby Atmos or alternative versions</span></div> </div>
            <div class="form-row"> <div class="form-group"><label for="trackLanguage${actualIndex}" class="form-label required">Language</label><select id="trackLanguage${actualIndex}" name="tracks[${zeroBasedIndex}][language]" class="form-control track-language-select" data-index="${actualIndex}" required><option value="">Select Language...</option><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="it">Italian</option><option value="pt">Portuguese</option><option value="instrumental">Instrumental</option><option value="other">Other</option></select></div> <div class="form-group"><label class="form-label">Explicit Content</label><div class="radio-toggle-group" id="trackExplicitGroup${actualIndex}"><label class="radio-toggle-option"><input type="radio" name="tracks[${zeroBasedIndex}][explicit]" value="No" id="trackExplicit${actualIndex}_No" checked><span class="radio-toggle-label">No</span></label><label class="radio-toggle-option"><input type="radio" name="tracks[${zeroBasedIndex}][explicit]" value="Yes" id="trackExplicit${actualIndex}_Yes"><span class="radio-toggle-label">Yes</span></label><label class="radio-toggle-option"><input type="radio" name="tracks[${zeroBasedIndex}][explicit]" value="Cleaned" id="trackExplicit${actualIndex}_Cleaned"><span class="radio-toggle-label">Cleaned</span></label></div></div> </div>
            <div class="form-group"><label for="trackLyrics${actualIndex}" class="form-label">Lyrics</label><textarea id="trackLyrics${actualIndex}" name="tracks[${zeroBasedIndex}][lyrics]" class="form-control" rows="4" placeholder="Enter track lyrics here..."></textarea></div>
        `;

        // --- Assemble Module and Append ---
        trackModule.appendChild(trackHeader);
        trackModule.appendChild(trackBody);
        document.getElementById('tracks-container').appendChild(trackModule);

        // --- Setup Event Handlers and Initial State ---
        setupTrackEventHandlers(actualIndex); // Setup accordion toggle, file inputs etc.

        // Initialize radio toggle state styling
        const newToggleGroup = trackModule.querySelector('.radio-toggle-group');
        if (newToggleGroup) setupRadioToggleState(newToggleGroup);

        // Delay setup of complex fields slightly to ensure elements are fully in DOM
        setTimeout(() => {
            setupTrackInputFields(actualIndex, zeroBasedIndex); // Setup artist/contributor inputs
            if (prefillData) {
                prefillTrackWithData(actualIndex, zeroBasedIndex, prefillData); // Prefill if data provided
            }
            if (animateIn) {
                // Trigger reflow before applying final opacity
                trackModule.offsetHeight;
                trackModule.style.opacity = '1';
            }
        }, 0);

        updateRemoveButtons(); // Update visibility of remove buttons on all tracks
        return trackModule;
    }

    /**
     * Sets up event handlers for a specific track module.
     * Includes accordion toggle, mix version buttons, file inputs, etc.
     * @param {number} index - The 1-based index of the track module.
     */
    function setupTrackEventHandlers(index) {
        const trackModule = document.getElementById(`track-${index}`);
        if (!trackModule) return;

        // --- Event Delegation for Clicks ---
        trackModule.addEventListener('click', function(event) {

            // Accordion Toggle Click
            if (event.target.closest('.accordion-toggle')) {
                // Prevent toggle if the click is on the remove button itself
                 if (event.target.closest('.remove-track-button-container button')) {
                    return; // Stop processing this click for accordion
                 }

                const header = event.target.closest('.accordion-toggle');
                const module = header.closest('.track-module');
                const icon = header.querySelector('.accordion-icon');
                const isCollapsed = module.classList.toggle('collapsed'); // Toggle class

                header.setAttribute('aria-expanded', !isCollapsed); // Update ARIA state
                if (icon) {
                    icon.innerHTML = isCollapsed ? '+' : '-'; // Change icon (+ collapsed, - expanded)
                }
            }
            // Add/Remove Track Mix Version Buttons
            else if (event.target.closest('.add-track-mix-version-btn')) {
                 const button = event.target.closest('.add-track-mix-version-btn');
                 const idx = button.dataset.index; // Get index from button data attribute
                 const container = document.getElementById(`trackMixVersionContainer${idx}`);
                 if(container) container.style.display = 'block'; // Show input
                 button.style.display = 'none'; // Hide add button
             }
             else if (event.target.closest('.remove-track-mix-version-btn')) {
                 const button = event.target.closest('.remove-track-mix-version-btn');
                 const idx = button.dataset.index;
                 const container = document.getElementById(`trackMixVersionContainer${idx}`);
                 const addButton = trackModule.querySelector(`.add-track-mix-version-btn[data-index="${idx}"]`); // Find corresponding add button
                 const input = document.getElementById(`trackMixVersion${idx}`);
                 if(container) container.style.display = 'none'; // Hide input container
                 if(addButton) addButton.style.display = 'inline-flex'; // Show add button
                 if(input) input.value = ''; // Clear the input value
             }
             // Add other click handlers here (e.g., for contributor add/remove if not handled elsewhere)
         });

         // --- Keyboard Accessibility for Accordion Header ---
         const header = trackModule.querySelector('.accordion-toggle');
         if(header) {
             header.addEventListener('keydown', function(event) {
                  // Toggle accordion on Enter or Space key press
                  if (event.key === 'Enter' || event.key === ' ') {
                       event.preventDefault(); // Prevent default space scroll or enter submit
                       header.click(); // Simulate a click to trigger the toggle logic
                  }
             });
         }

         // --- Event Delegation for Change Events ---
         trackModule.addEventListener('change', function(event) {
             // Dolby Atmos Checkbox -> Secondary ISRC Visibility
             if (event.target.matches('.track-dolby-atmos-toggle')) {
                 const idx = event.target.dataset.index;
                 const container = document.getElementById(`trackSecondaryISRCContainer${idx}`);
                 if(container) container.style.display = event.target.checked ? 'block' : 'none'; // Show/hide secondary ISRC
             }
             // Language Select -> Explicit Content Enable/Disable
             else if (event.target.matches('.track-language-select')) {
                 const idx = event.target.dataset.index;
                 const explicitGroup = document.getElementById(`trackExplicitGroup${idx}`);
                 const noOption = document.getElementById(`trackExplicit${idx}_No`);
                 const yesOption = document.getElementById(`trackExplicit${idx}_Yes`);
                 const cleanedOption = document.getElementById(`trackExplicit${idx}_Cleaned`);

                 if (event.target.value === 'instrumental') {
                     // If instrumental, disable explicit options and select 'No'
                     if(noOption) noOption.checked = true;
                     if(explicitGroup) {
                         explicitGroup.classList.add('disabled'); // Visual cue for disabled
                         if(yesOption) yesOption.disabled = true;
                         if(cleanedOption) cleanedOption.disabled = true;
                     }
                 } else {
                     // If not instrumental, enable explicit options
                     if(explicitGroup) {
                         explicitGroup.classList.remove('disabled');
                         if(yesOption) yesOption.disabled = false;
                         if(cleanedOption) cleanedOption.disabled = false;
                     }
                 }
                 // Trigger change on the radio group to update its visual state (color)
                 if(explicitGroup) {
                     const checkedRadio = explicitGroup.querySelector('input:checked');
                     if (checkedRadio) {
                         const changeEvent = new Event('change', { bubbles: true }); // Simulate change event
                         checkedRadio.dispatchEvent(changeEvent);
                     }
                 }
             }
             // File Input Change -> Display Filename
             else if (event.target.matches('input[type="file"].file-input')) {
                 const fileInput = event.target;
                 const displayTargetId = fileInput.dataset.displayTarget; // Get target span ID from data attribute
                 const displaySpan = trackModule.querySelector(`#${displayTargetId}`); // Find span within current track module

                 if (displaySpan) {
                     if (fileInput.files && fileInput.files.length > 0) {
                         displaySpan.textContent = fileInput.files[0].name; // Show selected filename
                         displaySpan.style.color = 'var(--text-color)'; // Reset color
                     } else {
                         displaySpan.textContent = 'No file selected'; // Show default text
                         displaySpan.style.color = 'var(--gray-600)'; // Dim color
                     }
                 }
             }
         });

        // --- Initialize State based on Current Values ---
        // Initialize the language-explicit linkage on load
        const languageSelect = document.getElementById(`trackLanguage${index}`);
        if (languageSelect && languageSelect.value === 'instrumental') {
            const explicitGroup = document.getElementById(`trackExplicitGroup${index}`);
            const noOption = document.getElementById(`trackExplicit${index}_No`);
            const yesOption = document.getElementById(`trackExplicit${index}_Yes`);
            const cleanedOption = document.getElementById(`trackExplicit${index}_Cleaned`);
            if (noOption) noOption.checked = true;
            if (explicitGroup) {
                explicitGroup.classList.add('disabled');
                if(yesOption) yesOption.disabled = true;
                if(cleanedOption) cleanedOption.disabled = true;
                // Trigger change to update visual state
                const checkedRadio = explicitGroup.querySelector('input:checked');
                if (checkedRadio) {
                    const changeEvent = new Event('change', { bubbles: true });
                    checkedRadio.dispatchEvent(changeEvent);
                }
            }
        }
        // Initialize secondary ISRC visibility based on Dolby Atmos checkbox
        const dolbyCheckbox = document.getElementById(`trackDolbyAtmos${index}`);
        const secondaryIsrcContainer = document.getElementById(`trackSecondaryISRCContainer${index}`);
        if (dolbyCheckbox && secondaryIsrcContainer) {
            secondaryIsrcContainer.style.display = dolbyCheckbox.checked ? 'block' : 'none';
        }
        // Initialize file display name
        const fileInput = document.getElementById(`trackAudioFile${index}`);
        if (fileInput) {
             const changeEvent = new Event('change', { bubbles: true });
             fileInput.dispatchEvent(changeEvent); // Trigger change to display initial filename if any
        }
    }


    /**
     * Sets up the dynamic artist and contributor input sections within a track module.
     * @param {number} index - The 1-based index of the track module.
     * @param {number} zeroBasedIndex - The 0-based index for array naming.
     */
    function setupTrackInputFields(index, zeroBasedIndex) {
        // Setup required track artist inputs
        setupArtistMechanism(`track-artist-container-${index}`, `tracks[${zeroBasedIndex}][artists][]`, true);
        // Setup optional publisher inputs (not required)
        setupArtistMechanism(`track-publisher-container-${index}`, `tracks[${zeroBasedIndex}][publishers][]`, false); // Changed to use setupArtistMechanism as it's simpler now
        // Setup optional featured artist section
        setupOtherArtistMechanism(`track-featured-artist-container-${index}`, `tracks[${zeroBasedIndex}][featuredArtists][]`, `add-track-featured-artist-btn-${index}`);
        // Setup optional remixer section
        setupOtherArtistMechanism(`track-remixer-container-${index}`, `tracks[${zeroBasedIndex}][remixers][]`, `add-track-remixer-btn-${index}`);
        // Setup contributor sections
        setupContributorContainer(`track-performer-container-${index}`, `tracks[${zeroBasedIndex}][performers]`, 'performer');
        setupContributorContainer(`track-composition-container-${index}`, `tracks[${zeroBasedIndex}][composition]`, 'composition');
        setupContributorContainer(`track-production-container-${index}`, `tracks[${zeroBasedIndex}][production]`, 'production');
    }

    /**
     * Prefills a track module's fields with data (e.g., from the release level).
     * Does not prefill audio file selection.
     * @param {number} index - The 1-based index of the track module.
     * @param {number} zeroBasedIndex - The 0-based index for array naming.
     * @param {object} data - The data object (typically formData.release).
     */
    function prefillTrackWithData(index, zeroBasedIndex, data) {
        const trackModule = document.getElementById(`track-${index}`);
        if (!trackModule || !data) return;

        // Prefill simple fields
        const trackNameInput = document.getElementById(`trackName${index}`);
        if (trackNameInput && data.title) trackNameInput.value = data.title;

        const trackMixVersionInput = document.getElementById(`trackMixVersion${index}`);
        const trackMixVersionContainer = document.getElementById(`trackMixVersionContainer${index}`);
        const addMixVersionBtn = trackModule.querySelector(`.add-track-mix-version-btn[data-index="${index}"]`);
        if (data.mixVersion && trackMixVersionInput && trackMixVersionContainer && addMixVersionBtn) {
            trackMixVersionContainer.style.display = 'block'; // Show container
            addMixVersionBtn.style.display = 'none'; // Hide add button
            trackMixVersionInput.value = data.mixVersion; // Set value
        }

        const genreSelect = document.getElementById(`trackGenre${index}`);
        if (data.genre && genreSelect) genreSelect.value = data.genre;

        // Prefill artist sections (using the helper function)
        if (data.artists && data.artists.length > 0) {
            prefillArtistValues(`track-artist-container-${index}`, `tracks[${zeroBasedIndex}][artists][]`, true, data.artists);
        }
        if (data.featuredArtists && data.featuredArtists.length > 0) {
            // Need to ensure the container/button state is correct before prefilling
            const containerId = `track-featured-artist-container-${index}`;
            const buttonId = `add-track-featured-artist-btn-${index}`;
            const container = document.getElementById(containerId);
            const btn = document.getElementById(buttonId);
            if(container && btn) {
                container.style.display = 'block'; // Show container
                btn.style.display = 'none'; // Hide add button
                prefillArtistValues(containerId, `tracks[${zeroBasedIndex}][featuredArtists][]`, false, data.featuredArtists);
            }
        }
        if (data.remixers && data.remixers.length > 0) {
            const containerId = `track-remixer-container-${index}`;
            const buttonId = `add-track-remixer-btn-${index}`;
             const container = document.getElementById(containerId);
            const btn = document.getElementById(buttonId);
             if(container && btn) {
                container.style.display = 'block';
                btn.style.display = 'none';
                prefillArtistValues(containerId, `tracks[${zeroBasedIndex}][remixers][]`, false, data.remixers);
            }
        }

        // Note: Contributors are generally track-specific and not prefilled from release level.
        // Note: Explicit content defaults to 'No', Language needs selection.
    }

    /**
     * Helper function to prefill artist input fields dynamically.
     * Clears existing inputs in the container before adding new ones.
     * @param {string} containerId - The ID of the container div.
     * @param {string} inputName - The base name attribute for the inputs.
     * @param {boolean} isRequired - Whether the inputs should be marked required.
     * @param {string[]} values - An array of string values to prefill.
     */
    function prefillArtistValues(containerId, inputName, isRequired, values) {
        const container = document.getElementById(containerId);
        if (!container || !Array.isArray(values) || values.length === 0) return;

        container.innerHTML = ''; // Clear existing rows first

        values.forEach((value) => {
            // Use the existing function to create the row structure
            const row = createArtistRowElement(inputName, isRequired);
            const input = row.querySelector('.artist-input');
            if (input) input.value = value; // Set the value
            container.appendChild(row);
        });

        // After adding all rows, update the buttons correctly
        // Determine if it's an optional section by checking for the button ID pattern
        let buttonId = null;
        if (containerId.includes('featured-artist')) {
            buttonId = containerId.replace('track-featured-artist-container-', 'add-track-featured-artist-btn-');
        } else if (containerId.includes('remixer')) {
            buttonId = containerId.replace('track-remixer-container-', 'add-track-remixer-btn-');
        }

        if (buttonId && document.getElementById(buttonId)) {
            // It's an optional section, use the optional update logic
             updateOptionalArtistRows(container, inputName, buttonId);
        } else {
            // It's a standard/required section
            updateArtistRows(container, inputName, isRequired);
        }
    }


    /**
     * Adds a new, empty track module (for multi-track mode).
     */
    function addTrack() {
        createTrack({ isRemovable: true, animateIn: true });
        updateRemoveButtons(); // Ensure buttons are updated immediately
    }

    /**
     * Adds a single track module and prefills it with release data (for single-track mode).
     */
    function addSingleTrackWithPrefill() {
        // Pass release data for prefilling, mark as not removable
        createTrack({ isRemovable: false, prefillData: formData.release, animateIn: true });
        updateRemoveButtons(); // Ensure no remove button appears
    }


    /**
     * Removes a track module from the DOM after confirmation.
     * @param {number} trackIdToRemove - The 1-based ID/index of the track to remove.
     */
    function removeTrack(trackIdToRemove) {
        const trackModule = document.getElementById(`track-${trackIdToRemove}`);
        if (!trackModule) return; // Exit if track not found

        const tracksContainer = document.getElementById('tracks-container');
        const trackModules = tracksContainer.querySelectorAll('.track-module');

        // Determine if removal is allowed
        const canRemove = !isSingleTrackMode && trackModules.length > 1;

        if (canRemove) {
            // Confirmation dialog
             if (!confirm(`Are you sure you want to remove Track ${trackIdToRemove}? All its data will be lost.`)) {
                 return; // User cancelled
             }

            // Animate removal
            trackModule.style.transition = 'opacity 0.3s ease-out, max-height 0.4s ease-out, margin-bottom 0.4s ease-out, padding-top 0.4s ease-out, padding-bottom 0.4s ease-out, border 0.4s ease-out';
            trackModule.style.opacity = '0';
            // Set max-height for transition AFTER getting current height
            trackModule.style.maxHeight = trackModule.offsetHeight + 'px';
            // Trigger reflow before setting max-height to 0
            trackModule.offsetHeight;
            trackModule.style.maxHeight = '0';
            // Animate padding/margin/border out
            trackModule.style.paddingTop = '0';
            trackModule.style.paddingBottom = '0';
            trackModule.style.marginBottom = '0';
            trackModule.style.borderWidth = '0';

            // Remove from DOM after animation
            setTimeout(() => {
                trackModule.remove();
                updateTrackNumbersAndNames(); // Renumber remaining tracks
                updateRemoveButtons(); // Update remove button visibility
            }, 400); // Match timeout to longest transition

        } else if (isSingleTrackMode) {
            alert("Cannot remove the track in Single Track Release mode.");
        } else {
            alert("Cannot remove the last track.");
        }
    }


    /**
     * Updates the displayed track numbers and re-indexes form input names/IDs
     * after a track has been removed.
     */
    function updateTrackNumbersAndNames() {
        const trackModules = document.querySelectorAll('#tracks-container .track-module');
        trackModules.forEach((module, index) => {
            const newTrackNumber = index + 1; // New 1-based number
            const zeroBasedIndex = index; // New 0-based index for names

            // Update Track Number Display in Header
            const trackLabel = module.querySelector('.track-number');
            if (trackLabel) trackLabel.textContent = `Track ${newTrackNumber}`;

            // Update Module ID
            module.id = `track-${newTrackNumber}`;

            // Update IDs, names, data-attributes, and 'for' attributes within the module
            const elementsToUpdate = module.querySelectorAll('[id^="track"], [name^="tracks["], [data-index], [data-container*="track-"], [data-display-target^="track"], label[for^="track"]');

            elementsToUpdate.forEach(el => {
                const oldId = el.id;
                const oldName = el.name;
                const oldDataIndex = el.dataset.index;
                const oldDataContainer = el.dataset.container;
                const oldDisplayTarget = el.dataset.displayTarget;
                const oldFor = el.htmlFor;

                // Regex to find the number part in common patterns
                const idRegex = /(track(?:Name|MixVersion|Artist|Featured|Remixer|Performer|Composition|Production|Publisher|Genre|ISRC|DolbyAtmos|SecondaryISRC|Language|Explicit|Lyrics|AudioFile|AudioFileNameDisplay|MixVersionContainer|Artist-container|Featured-artist-container|Remixer-container|Performer-container|Composition-container|Production-container|Publisher-container|SecondaryISRCContainer|ExplicitGroup)|add-track-(?:featured-artist|remixer)-btn-)(\d+)/;
                const explicitIdRegex = /(trackExplicit)(\d+)(_No|_Yes|_Cleaned)/;

                // Update IDs
                if (oldId) {
                    if (explicitIdRegex.test(oldId)) {
                        el.id = oldId.replace(explicitIdRegex, `$1${newTrackNumber}$3`);
                    } else if (idRegex.test(oldId)) {
                         el.id = oldId.replace(idRegex, `$1${newTrackNumber}`);
                    } else if (oldId.startsWith('track-body-')) { // Update track body ID
                         el.id = `track-body-${newTrackNumber}`;
                    }
                }

                // Update names (for form submission)
                if (oldName && oldName.startsWith('tracks[')) {
                    el.name = oldName.replace(/tracks\[\d+\]/, `tracks[${zeroBasedIndex}]`);
                }

                // Update data attributes
                if (oldDataIndex) { el.dataset.index = newTrackNumber; }
                if (oldDataContainer && oldDataContainer.includes('-container-')) {
                    el.dataset.container = oldDataContainer.replace(/-container-\d+/, `-container-${newTrackNumber}`);
                }
                 if (oldDisplayTarget && oldDisplayTarget.startsWith('trackAudioFileNameDisplay')) {
                     el.dataset.displayTarget = oldDisplayTarget.replace(/\d+$/, newTrackNumber);
                 }

                // Update label 'for' attributes
                if (el.tagName === 'LABEL' && oldFor) {
                     if (explicitIdRegex.test(oldFor)) {
                        el.htmlFor = oldFor.replace(explicitIdRegex, `$1${newTrackNumber}$3`);
                     } else if (idRegex.test(oldFor)) {
                         el.htmlFor = oldFor.replace(idRegex, `$1${newTrackNumber}`);
                     }
                }

                 // Update ARIA attributes on header
                 if (el.classList.contains('accordion-toggle')) {
                     el.setAttribute('aria-controls', `track-body-${newTrackNumber}`);
                 }
            });

            // Re-run setup for event handlers to ensure they target the updated elements
            // Note: Event delegation might reduce the need for this, but re-running setup ensures
            // specific handlers attached directly (like contributor buttons) are correct.
            setupTrackEventHandlers(newTrackNumber);

            // Re-initialize radio toggle state styling
            const toggleGroup = module.querySelector('.radio-toggle-group');
            if (toggleGroup) setupRadioToggleState(toggleGroup);

            // Re-initialize artist/contributor sections to potentially fix button listeners
            // This might be overkill if using delegation well, but safer.
            // setupTrackInputFields(newTrackNumber, zeroBasedIndex); // Careful: This might reset fields if not handled well. Commented out for now.
        });
    }


    /**
     * Updates the visibility and functionality of the "Remove Track" buttons
     * based on the current mode (single/multi) and the number of tracks.
     */
    function updateRemoveButtons() {
        const trackModules = document.querySelectorAll('#tracks-container .track-module');
        // Remove buttons should only show in multi-track mode when there's more than one track
        const shouldShowRemoveButtons = !isSingleTrackMode && trackModules.length > 1;

        trackModules.forEach(module => {
            const trackNumber = parseInt(module.id.replace('track-', ''), 10); // Get current track number from ID
            const buttonContainer = module.querySelector('.remove-track-button-container');
            if (!buttonContainer) return; // Skip if container not found

            let existingBtn = buttonContainer.querySelector('.remove-track-btn');

            if (shouldShowRemoveButtons) {
                // If remove buttons should be shown, add one if it doesn't exist
                if (!existingBtn) {
                    const removeTrackBtn = document.createElement('button');
                    removeTrackBtn.type = 'button';
                    removeTrackBtn.className = 'btn btn-sm btn-danger remove-track-btn'; // Style as danger
                    // Add icon for visual cue
                    removeTrackBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.375rem;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Remove Track`;
                    removeTrackBtn.setAttribute('aria-label', `Remove Track ${trackNumber}`);
                    // Attach the click handler to call removeTrack with the correct ID
                    removeTrackBtn.onclick = function() {
                        // Get the ID again *at the time of click* in case renumbering happened
                        const currentTrackId = parseInt(this.closest('.track-module').id.replace('track-', ''), 10);
                        removeTrack(currentTrackId); // Call remove function
                    };
                    buttonContainer.appendChild(removeTrackBtn);
                } else {
                    // If button exists, ensure its aria-label is up-to-date
                     existingBtn.setAttribute('aria-label', `Remove Track ${trackNumber}`);
                     // Re-attach onclick to ensure it uses the latest ID (might be redundant if ID doesn't change, but safe)
                     existingBtn.onclick = function() {
                        const currentTrackId = parseInt(this.closest('.track-module').id.replace('track-', ''), 10);
                        removeTrack(currentTrackId);
                    };
                }
            } else {
                // If remove buttons should NOT be shown, remove the button if it exists
                if (existingBtn) {
                    existingBtn.remove();
                }
            }
        });
    }


    // --- Initial Setup Calls ---
    // Initialize state for any existing radio toggles on page load
    document.querySelectorAll('.radio-toggle-group').forEach(group => {
        setupRadioToggleState(group);
    });
    // Set initial state of remove buttons (important if starting in multi-track mode with >1 track)
    updateRemoveButtons();


}); // End DOMContentLoaded
