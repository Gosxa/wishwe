// Django's AvatarSerializer uses a plain DRF ImageField, which only accepts
// real file uploads. Convert the cropper's data URL into multipart form data.
export const avatarFormData = async (dataUrl: string): Promise<FormData> => {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.split('/')[1] ?? 'jpeg';

  const formData = new FormData();

  formData.append('avatar', blob, `avatar.${ext}`);

  return formData;
};
