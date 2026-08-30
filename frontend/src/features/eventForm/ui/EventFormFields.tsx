import { CategoryPicker } from '@shared/ui/categoryPicker/CategoryPicker';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { TextArea } from '@shared/ui/textArea/TextArea';
import { TextInput } from '@shared/ui/textInput/TextInput';
import type { EventFormMode, EventFormModel } from '../model/types';
import { EVENT_FORM_COPY } from './eventFormCopy';
import { EventTimingFields } from './EventTimingFields';
import { LocationField } from './LocationField';
import { PrivacyPicker } from './PrivacyPicker';
import s from './eventFormModal.module.scss';

type Props = {
  mode: EventFormMode;
  form: EventFormModel;
};

export const EventFormFields = ({ mode, form }: Props) => {
  const {
    isPlan,
    category,
    titleInput,
    locationInput,
    locationPicker,
    descriptionInput,
    chatLinkInput,
    visibility,
    submit,
  } = form;
  const eventType = isPlan ? 'plan' : 'wish';
  const content = EVENT_FORM_COPY[mode];

  return (
    <div className={s.fields}>
      <CategoryPicker
        categories={category.options}
        isLoading={category.isLoading}
        selected={category.selected}
        onChange={category.onChange}
        error={category.error}
      />

      <TextInput
        id="eventTitle"
        tourId="field-title"
        label={isPlan ? "What's the plan?" : "What's your wish?"}
        placeholder={content.titlePlaceholder[eventType]}
        required
        value={titleInput.value}
        onChange={event => titleInput.onChange(event.target.value)}
        helperText="Up to 50 characters"
        error={titleInput.error}
        maxLength={50}
        showCounter
      />

      <LocationField
        mode={mode}
        placeholder={content.locationPlaceholder[eventType]}
        input={locationInput}
        picker={locationPicker}
      />

      <TextArea
        id="eventDescription"
        tourId="field-description"
        label="Description"
        placeholder={content.descriptionPlaceholder[eventType]}
        value={descriptionInput.value}
        onChange={event => descriptionInput.onChange(event.target.value)}
        helperText="Up to 200 characters"
        error={descriptionInput.error}
        maxLength={200}
        showCounter
      />

      <EventTimingFields mode={mode} form={form} />

      {mode === 'create' && (
        <PrivacyPicker
          value={visibility.value}
          onChange={visibility.onChange}
        />
      )}

      {isPlan && (
        <TextInput
          id="eventChatLink"
          label="Chat link"
          placeholder="Link to telegram or whatsapp group chat"
          value={chatLinkInput.value}
          onChange={event => chatLinkInput.onChange(event.target.value)}
          error={chatLinkInput.error}
        />
      )}

      {submit.error && <HelperText text={submit.error} type="error" inline />}
    </div>
  );
};
