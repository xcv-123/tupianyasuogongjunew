document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const downloadBtn = document.getElementById('downloadBtn');
    const controls = document.querySelector('.compression-controls');
    const previewContainer = document.querySelector('.preview-container');
    const uploadContent = document.getElementById('uploadContent');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const replaceBtn = document.getElementById('replaceBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const compressedPreviewContainer = document.getElementById('compressedPreviewContainer');

    let currentFile = null;

    // 重置所有状态
    function resetState() {
        currentFile = null;
        uploadContent.style.display = 'flex';
        imagePreviewContainer.style.display = 'none';
        compressedPreviewContainer.style.display = 'none';
        controls.style.display = 'none';
        downloadBtn.style.display = 'none';
        originalImage.src = '';
        compressedImage.src = '';
        compressedImage.style.display = 'none';
        originalSize.textContent = '';
        compressedSize.textContent = '';
        fileInput.value = ''; // 清空文件输入
        
        // 清除可能存在的错误提示
        const oldError = dropZone.querySelector('.error-message');
        if (oldError) oldError.remove();
    }

    // 显示图片预览
    function showPreview() {
        uploadContent.style.display = 'none';
        imagePreviewContainer.style.display = 'block';
        compressedPreviewContainer.style.display = 'block';
        controls.style.display = 'block';
        downloadBtn.style.display = 'block';
    }

    // 点击替换按钮
    replaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // 点击删除按钮
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetState();
    });

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());

    // 文件拖拽处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        try {
            if (e.target.files.length) {
                handleFile(e.target.files[0]);
            } else {
                showError('未选择任何文件');
            }
        } catch (error) {
            console.error('文件选择错误:', error);
            showError('文件处理出错，请重试');
            resetState();
        }
    });

    // 质量滑块变化处理
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        if (currentFile) compressImage(currentFile);
    });

    // 添加加载状态提示
    function showLoading() {
        // 显示加载动画
    }

    function hideLoading() {
        // 隐藏加载动画
    }

    // 处理选择的文件
    function handleFile(file) {
        // 清除可能存在的旧错误提示
        const oldError = dropZone.querySelector('.error-message');
        if (oldError) oldError.remove();

        if (!file) {
            showError('请选择一个文件');
            return;
        }

        if (!file.type.match(/image\/(jpeg|png)/)) {
            showError('请选择 PNG 或 JPG 格式的图片！');
            resetState(); // 使用统一的重置函数
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            showError('文件太大，请选择小于20MB的图片');
            resetState(); // 使用统一的重置函数
            return;
        }

        // 重置之前的图片状态
        originalImage.src = '';
        compressedImage.src = '';
        
        currentFile = file;
        originalSize.textContent = `文件大小：${formatFileSize(file.size)}`;
        
        const loadImage = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImage.onload = () => resolve();
                originalImage.onerror = () => reject(new Error('图片加载失败'));
                originalImage.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });

        loadImage
            .then(() => {
                showPreview();
                return compressImage(file);
            })
            .catch(error => {
                console.error('图片处理失败:', error);
                showError('图片处理失败，请重试');
                resetState();
            });
    }

    // 压缩图片
    function compressImage(file) {
        showLoading();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 保持宽高比
                    const maxWidth = 1920;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (maxWidth * height) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // 压缩图片
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('压缩失败'));
                            return;
                        }

                        const compressedUrl = URL.createObjectURL(blob);
                        compressedImage.onload = () => {
                            compressedImage.style.display = 'block';
                            compressedSize.textContent = `文件大小：${formatFileSize(blob.size)}`;
                            
                            // 更新下载按钮
                            downloadBtn.onclick = () => {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = `compressed_${file.name}`;
                                link.click();
                            };
                            resolve();
                        };
                        compressedImage.onerror = () => reject(new Error('压缩图片加载失败'));
                        compressedImage.src = compressedUrl;
                    }, 'image/jpeg', qualitySlider.value / 100);
                };

                img.onerror = () => reject(new Error('源图片加载失败'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        })
        .finally(() => {
            hideLoading();
        });
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 在删除图片的函数中需要正确重置状态
    function deleteImage() {
        resetState(); // 使用统一的重置函数
    }

    // 在处理图片上��的函数中添加以下检查
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return; // 如果没有选择文件，直接返回
        
        // 隐藏上传提示
        document.getElementById('uploadTip').style.display = 'none';
        
        // 其余的上传处理代码...
    }

    // 在 DOMContentLoaded 事件监听器内部添加错误提示函数
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ff3b30;
            background-color: #ffe5e5;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            text-align: center;
        `;
        dropZone.insertBefore(errorDiv, uploadContent);
        
        // 3秒后自动移除错误提示
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}); 