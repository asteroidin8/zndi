import { useState } from 'react';

import { DatePickerModal } from './DatePickerModal';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { TodoFormFields, todayStr } from './TodoFormFields';
import type { TodoPriority } from '@/stores/useTodoStore';

export type TodoCreatePayload = {
  title: string;
  priority: TodoPriority;
  dueDate: string | null;
  pinnedToHome: boolean;
  groupId: string | null;
  section: string | null;
};

type Props = {
  visible: boolean;
  onSave: (payload: TodoCreatePayload) => void;
  onClose: () => void;
};

export function TodoModal({ visible, onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('mid');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [section, setSection] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  function reset() {
    setTitle('');
    setPriority('mid');
    setDueDate(null);
    setGroupId(null);
    setSection('');
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority, dueDate, pinnedToHome: false, groupId, section: section.trim() || null });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={handleClose}
        title="할 일 추가"
        footer={<SheetPrimaryButton label="추가" onPress={handleSave} disabled={!title.trim()} />}
      >
        <TodoFormFields
          title={title}
          onTitleChange={setTitle}
          priority={priority}
          onPriorityChange={setPriority}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          groupId={groupId}
          onGroupIdChange={setGroupId}
          section={section}
          onSectionChange={setSection}
          onDatePickerOpen={() => setDatePickerVisible(true)}
        />
      </SheetModal>

      <DatePickerModal
        visible={datePickerVisible}
        value={dueDate}
        minimumDate={todayStr()}
        onConfirm={(date) => { setDueDate(date); setDatePickerVisible(false); }}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
}
