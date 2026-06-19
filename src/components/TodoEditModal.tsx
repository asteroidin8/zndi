import { useEffect, useState } from 'react';

import { DatePickerModal } from './DatePickerModal';
import { SheetDangerButton, SheetModal, SheetPrimaryButton } from './SheetModal';
import { TodoFormFields, todayStr } from './TodoFormFields';
import type { Todo, TodoPriority } from '@/stores/useTodoStore';

type Props = {
  visible: boolean;
  todo: Todo | null;
  onSave: (updates: Pick<Todo, 'title' | 'priority' | 'dueDate' | 'pinnedToHome' | 'groupId'>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function TodoEditModal({ visible, todo, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('mid');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setPriority(todo.priority);
      setDueDate(todo.dueDate);
      setGroupId(todo.groupId ?? null);
      setDatePickerVisible(false);
    }
  }, [todo]);

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), priority, dueDate, pinnedToHome: false, groupId });
  }

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={onClose}
        title="할 일 편집"
        footer={
          <>
            <SheetPrimaryButton label="저장" onPress={handleSave} disabled={!title.trim()} />
            <SheetDangerButton label="삭제" onPress={onDelete} />
          </>
        }
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
          onDatePickerOpen={() => setDatePickerVisible(true)}
          onSubmit={handleSave}
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
