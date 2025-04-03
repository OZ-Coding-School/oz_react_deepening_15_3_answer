import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Boards from './components/Boards';
import Controller from './components/Controller';
import { useBoardStore } from './store';
import { useState } from 'react';

function App() {
  // Zustand 스토어에서 필요한 데이터와 함수들을 가져옵니다
  // data: 모든 항목들의 배열
  // updateBoardType: 항목의 타입(보드)을 변경하는 함수
  // reorderItems: 항목들의 순서를 변경하는 함수
  const { data, updateBoardType, reorderItems } = useBoardStore();

  // 현재 드래그 중인 항목의 ID를 저장합니다
  const [activeId, setActiveId] = useState(null);

  // dnd-kit의 센서 설정
  // 센서는 드래그 시작 조건을 설정합니다
  // PointerSensor는 마우스/터치 이벤트를 감지합니다
  // activationConstraint: 드래그를 시작하기 위해 필요한 최소 이동 거리 (5px)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // 현재 드래그 중인 항목의 데이터를 찾습니다
  const activeItem = activeId ? data.find((item) => item.id === activeId) : null;

  // 보드 타입별로 항목 ID들을 그룹화합니다
  // 이 데이터는 각 보드(Boards 컴포넌트)에 전달됩니다

  // 드래그 시작 핸들러
  // 사용자가 항목을 드래그하기 시작할 때 호출됩니다
  const handleDragStart = (event) => {
    // active: 현재 드래그되는 항목
    const { active } = event;
    // 드래그 중인 항목의 ID를 상태에 저장합니다
    setActiveId(active.id);
  };

  // 드래그 종료 핸들러
  // 사용자가 항목을 드롭할 때 호출됩니다
  const handleDragEnd = (event) => {
    // active: 드래그한 항목, over: 드롭된 위치에 있는 항목 또는 컨테이너
    const { active, over } = event;

    // 유효한 드롭 위치가 없으면 종료
    if (!over) {
      setActiveId(null);
      return;
    }

    // 드래그 중인 항목 찾기
    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // 다른 보드로 항목 이동 (예: todo -> inprogress)
    // over.data?.current?.type은 드롭된 보드의 타입을 나타냄 (useDroppable에서 data로 설정한 값)
    if (over.data?.current?.type && activeItem.type !== over.data.current.type) {
      // 항목의 타입을 변경하여 다른 보드로 이동
      updateBoardType(active.id, over.data.current.type);
    }
    // 동일 보드 내에서 항목 순서 변경
    else if (over.id !== active.id) {
      // 드래그한 항목과 드롭 위치 항목의 인덱스 찾기
      const activeIndex = data.findIndex((item) => item.id === active.id);
      const overIndex = data.findIndex((item) => item.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        // arrayMove: dnd-kit이 제공하는 배열 재정렬 유틸리티 함수
        // 배열 내에서 항목의 위치를 변경합니다
        const newItems = arrayMove(data, activeIndex, overIndex);
        // 재정렬된 항목들로 상태 업데이트
        reorderItems(newItems);
      }
    }

    // 드래그 종료 후 activeId 상태 초기화
    setActiveId(null);
  };

  // 드래그 오버 핸들러
  // 항목이 드래그되면서 다른 항목이나 영역 위에 있을 때 지속적으로 호출됩니다
  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) return;

    // 다른 보드 위로 드래그 중일 때
    // 시각적 피드백을 위해 임시로 타입 변경 (실제 데이터는 handleDragEnd에서 변경됨)
    if (over.data?.current?.type && activeItem.type !== over.data.current.type && active.id !== over.id) {
      updateBoardType(active.id, over.data.current.type);
    }
  };

  return (
    // DndContext: dnd-kit의 핵심 컴포넌트로 드래그 앤 드롭 기능을 제공
    <DndContext
      sensors={sensors}
      // rectIntersection: 간단한 충돌 감지 알고리즘으로 요소 간 겹침을 확인
      // (closestCorners, pointerWithin 등 다른 알고리즘도 있음)
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col h-screen">
        <header className="w-full h-[80px] bg-slate-800 flex flex-col items-center justify-center text-stone-100">
          <p className="text-lg font-semibold">Kanban Board Project</p>
          <p>Chapter 3. Drag & Drop</p>
        </header>
        <main className="flex-1 flex flex-col justify-between overflow-y-scroll">
          <div className="grid grid-cols-3 gap-4 p-4 w-full h-full">
            {/* 각 타입별 보드 컴포넌트 */}
            <Boards type={'todo'} />
            <Boards type={'inprogress'} />
            <Boards type={'done'} />
          </div>
          <Controller />
        </main>
        <footer className="w-full h-[60px] bg-slate-800 flex items-center text-stone-100 justify-center">
          <p>&copy; OZ-CodingSchool</p>
        </footer>
      </div>
      {/* DragOverlay: 드래그 중인 항목을 시각적으로 표시 */}
      <DragOverlay>
        {activeId && activeItem && (
          <div className="bg-white shadow-xl rounded-md p-4 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{activeItem.title}</h3>
              {activeItem.type === 'todo' && <div className="animate-pulse w-2 h-2 rounded-full bg-green-500"></div>}
              {activeItem.type === 'inprogress' && (
                <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500"></div>
              )}
              {activeItem.type === 'done' && <div className="animate-pulse w-2 h-2 rounded-full bg-red-500"></div>}
            </div>
            <p className="text-sm text-gray-500">{activeItem.created_at}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
