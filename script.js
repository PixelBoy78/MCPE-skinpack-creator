// Function to show custom modal
function showAlert(message) {
    const modal = document.getElementById('alertModal');
    const msgText = document.getElementById('modalMessage');
    
    msgText.textContent = message;
    modal.classList.remove('hidden');
}

// Function to close custom modal
document.getElementById('modalCloseBtn').addEventListener('click', function() {
    document.getElementById('alertModal').classList.add('hidden');
});

// Close modal on outside click
document.getElementById('alertModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

// Add visual feedback for file inputs
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function() {
        const labelSpan = document.getElementById('fileName' + this.id.replace('file', ''));
        const labelContainer = this.previousElementSibling; // The label element

        if (this.files && this.files.length > 0) {
            labelSpan.textContent = this.files[0].name;
            labelContainer.classList.add('file-uploaded');
        } else {
            labelSpan.textContent = 'Choose PNG';
            labelContainer.classList.remove('file-uploaded');
        }
    });
});

document.getElementById('generatePackBtn').addEventListener('click', function() {
    var packName = document.getElementById('packName').value.trim();
    
    // REPLACED standard alert with showAlert()
    if (!packName) {
        showAlert("Please enter a skin pack name before downloading.");
        return;
    }

    var files = [
        document.getElementById('file1').files[0],
        document.getElementById('file2').files[0],
        document.getElementById('file3').files[0],
        document.getElementById('file4').files[0],
        document.getElementById('file5').files[0]
    ].filter(file => file && file.type === "image/png");

    // REPLACED standard alert with showAlert()
    if (files.length === 0) {
        showAlert("Please upload at least one PNG skin file.");
        return;
    }

    var geometries = [
        document.querySelector('input[name="size1"]:checked').value === 'wide' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
        document.querySelector('input[name="size2"]:checked').value === 'wide' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
        document.querySelector('input[name="size3"]:checked').value === 'wide' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
        document.querySelector('input[name="size4"]:checked').value === 'wide' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim',
        document.querySelector('input[name="size5"]:checked').value === 'wide' ? 'geometry.humanoid.custom' : 'geometry.humanoid.customSlim'
    ];

    var zip = new JSZip();
    
    // Generate two UUIDs
    var headerUUID = uuid.v4();
    var moduleUUID = uuid.v4();

    var manifest = {
        "format_version": 2,
        "header": {
            "name": packName,
            "uuid": headerUUID,
            "version": [1, 0, 0]
        },
        "modules": [
            {
                "type": "skin_pack",
                "uuid": moduleUUID,
                "version": [1, 0, 0]
            }
        ]
    };

    var packKey = packName.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'skinpack';

    var skins = {
        "geometry": "geometry.json",
        "localization_name": packKey,
        "skins": []
    };

    var langFile = `skinpack.${packKey}=${packName}\n`;

    var filePromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
            var skinName = `skin${index + 1}`;
            var geometry = geometries[index];

            skins.skins.push({
                "localization_name": skinName,
                "geometry": geometry,
                "texture": `${skinName}.png`,
                "type": "free"
            });

            langFile += `skin.${packKey}.${skinName}=Skin #${index + 1}\n`;

            var reader = new FileReader();
            reader.onload = function(e) {
                zip.file(`${skinName}.png`, e.target.result.split(',')[1], { base64: true });
                resolve();
            };
            reader.onerror = function(error) {
                console.error("FileReader error:", error);
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    });

    Promise.all(filePromises)
        .then(() => {
            zip.file("manifest.json", JSON.stringify(manifest, null, 2));
            zip.file("skins.json", JSON.stringify(skins, null, 2));
            zip.folder("texts").file("en_US.lang", langFile);

            var safeName = packName.replace(/[/\\?%*:|"<>]/g, '').trim();
            safeName = safeName.replace(/\.mcpack$/i, '').trim();
            if (!safeName) {
                safeName = 'custom';
            }

            var fileName;
            if (/skinpack$/i.test(safeName)) {
                fileName = `${safeName}.mcpack`;
            } else if (safeName.endsWith('_') || safeName.endsWith('-')) {
                fileName = `${safeName}skinpack.mcpack`;
            } else {
                fileName = `${safeName}_skinpack.mcpack`;
            }

            return zip.generateAsync({ type: "blob" }).then(content => {
                var link = document.createElement("a");
                link.href = URL.createObjectURL(content);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        })
        .catch(error => {
            alert("An error occurred while generating the zip file.");
            console.error("Error details:", error);
        });
});