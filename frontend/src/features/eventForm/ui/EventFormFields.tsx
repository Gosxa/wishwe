import { CategoryPicker } from '@shared/ui/categoryPicker/CategoryPicker';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { TextArea } from '@shared/ui/textArea/TextArea';
import { TextInput } from '@shared/ui/textInput/TextInput';
import type { EventFormMode, EventFormModel } from '../model/types';
import { EVENT_FORM_COPY } from './eventFormCopy';
import { EventTimingFields } from './EventTimingFields';
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
        selected={category.selected}
        onChange={category.onChange}
        error={category.error}
      />

      <TextInput
        id="eventTitle"
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

      <TextInput
        id="eventLocation"
        label="Where?"
        placeholder={content.locationPlaceholder[eventType]}
        required
        value={locationInput.value}
        onChange={event => locationInput.onChange(event.target.value)}
        error={locationInput.error}
      />

      <TextArea
        id="eventDescription"
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
