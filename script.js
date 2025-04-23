document.addEventListener('DOMContentLoaded', () => {
  // Add Artist
  const addArtistBtn = document.getElementById('addArtist');
  const artistFields = document.getElementById('artistFields');
  addArtistBtn.addEventListener('click', () => {
    const newArtist = artistFields.firstElementChild.cloneNode(true);
    newArtist.querySelector('input').value = '';
    newArtist.querySelector('.remove-artist').classList.remove('hidden');
    artistFields.appendChild(newArtist);
  });

  // Remove Artist
  artistFields.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-artist') && artistFields.children.length > 1) {
      e.target.parentElement.remove();
    }
  });

  // Add Track
  const addTrackBtn = document.getElementById('addTrack');
  const trackFields = document.getElementById('trackFields');
  let trackCount = 1;
  addTrackBtn.addEventListener('click', () => {
    if (trackCount < 10) {
      trackCount++;
      const nextTrack = trackFields.querySelector(`.track-group:nth-child(${trackCount})`);
      nextTrack.classList.remove('hidden');
    }
  });

  // Form Submission
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const artistNames = Array.from(document.querySelectorAll('input[name="artistName[]"]'))
      .map(input => input.value)
      .filter(val => val);
    const releaseTitle = document.querySelector('input[name="releaseTitle"]').value;
    const labelName = document.querySelector('input[name="labelName"]').value;
    const coverImage = document.querySelector('input[name="coverImage"]').files[0];
    const tracks = Array.from(document.querySelectorAll('input[name="tracks[]"]'))
      .map(input => input.files[0])
      .filter(file => file);

    // Generate CSV
    const csvContent = generateCSV(artistNames, releaseTitle, labelName, tracks);
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });

    // Create FormData
    const formData = new FormData();
    formData.append('coverImage', coverImage);
    tracks.forEach((track, index) => {
      formData.append('tracks', track);
    });
    formData.append('csv', csvBlob, `release_${releaseTitle}.csv`);
    formData.append('releaseTitle', releaseTitle);
    formData.append('labelName', labelName);
    formData.append('artistNames', artistNames.join(', '));

    try {
      const response = await fetch('https://script.google.com/macros/s/your_web_app_url/exec', {
        method: 'POST',
        body: formData
      });
      const result = await response.text();
      alert(result);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  });

  // Generate CSV (mimic your existing structure)
  function generateCSV(artistNames, releaseTitle, labelName, tracks) {
    const headers = ['Artist Names', 'Release Title', 'Label Name', 'Track Count', 'Image Included'];
    const row = [
      artistNames.join('; '),
      releaseTitle,
      labelName,
      tracks.length,
      'Yes'
    ];
    return [headers.join(','), row.join(',')].join('\n');
  }
});
