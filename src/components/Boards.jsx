import React, { useState } from 'react';
import BoardDetailModal from './BoardDetailModal';
import { useBoardStore } from '../store';
import BoardConfirmModal from './BoardConfirmModal';
import BoardEditModal from './BoardEditModal';
// dnd-kit의 드롭 영역을 설정하기 위한 훅
import { useDroppable } from '@dnd-kit/core';
// dnd-kit의 정렬 기능을 위한 컴포넌트와 훅
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

// 보드 타입을 한글로 변환하는 함수
const typeToKorean = (type) => {
  switch (type) {
    case 'todo':
      return '할 일';
    case 'inprogress':
      return '진행 중';
    case 'done':
      return '완료';
    default:
      return type;
  }
};

// Boards 컴포넌트: 각 칸반 보드(할 일, 진행 중, 완료)를 표시
// type: 보드 타입 (todo, inprogress, done)
// items: 해당 보드에 속한 항목들의 ID 배열
const Boards = ({ type }) => {
  // Zustand 스토어에서 전체 데이터 가져오기
  const { data } = useBoardStore();
  // 현재 보드 타입에 해당하는 항목들만 필터링
  const filteredData = data.filter((item) => item.type === type);

  // 모달 상태 관리를 위한 state
  const [item, setItem] = useState(null); // 선택된 항목 정보
  const [isOpen, setIsOpen] = useState(false); // 상세 모달 표시 여부
  const [confirmIsOpen, setConfirmIsOpen] = useState(false); // 삭제 확인 모달 표시 여부
  const [editIsOpen, setEditIsOpen] = useState(false); // 편집 모달 표시 여부
  const [selectedId, setSelectedId] = useState(null); // 선택된 항목 ID (삭제 시 사용)

  // useDroppable: 드롭 영역을 설정하는 dnd-kit 훅
  // id: 드롭 영역의 고유 식별자 (보드 타입)
  // data: 드롭 영역에 대한 추가 정보
  // setNodeRef: 실제 DOM 요소를 드롭 영역으로 등록하는 ref 함수
  // isOver: 현재 드래그 중인 항목이 이 영역 위에 있는지 여부
  const { setNodeRef, isOver } = useDroppable({
    id: type,
    data: {
      type, // 현재 보드 타입 (드래그 이벤트에서 접근 가능)
      accepts: ['todo', 'inprogress', 'done'], // 허용되는 드래그 항목 타입
    },
  });

  // 항목 상세 모달 열기
  const handleModalOpen = (item) => {
    setItem(item);
    setIsOpen(true);
  };

  // 항목 상세 모달 닫기
  const handleModalClose = () => {
    setItem(null);
    setIsOpen(false);
  };

  // 삭제 확인 모달 열기
  const handleConfirmModalOpen = (id) => {
    setSelectedId(id);
    handleModalClose(); // 상세 모달 닫기
    setConfirmIsOpen(true);
  };

  // 삭제 확인 모달 닫기
  const handleConfirmModalClose = () => {
    setConfirmIsOpen(false);
    setSelectedId(null);
  };

  // 항목 편집 모달 열기
  const handleEditModalOpen = () => {
    setEditIsOpen(true);
    setIsOpen(false); // 상세 모달 닫기
  };

  // 항목 편집 모달 닫기
  const handleEditModalClose = () => {
    setEditIsOpen(false);
  };

  return (
    <div
      // 드래그 오버 시 스타일 변경으로 시각적 피드백 제공
      className={`select-none w-full flex flex-col h-full ${
        isOver ? 'bg-slate-200 rounded-md ring-2 ring-slate-400 ring-inset' : ''
      }`}
      // setNodeRef: 이 요소를 드롭 영역으로 등록
      ref={setNodeRef}
    >
      {/* 보드 헤더 */}
      <div className="w-full h-[60px] bg-stone-200 rounded-sm flex items-center justify-center">
        <p className="text-lg font-semibold">{typeToKorean(type)}</p>
      </div>

      {/* 보드 내용 영역 */}
      <div className="flex flex-col gap-2 p-4 flex-1 min-h-[400px]">
        {/* SortableContext: dnd-kit의 정렬 기능을 제공하는 컨텍스트
            items: 정렬 가능한 항목들의 ID 배열
            strategy: 정렬 방식 (verticalListSortingStrategy: 수직 목록) */}
        <SortableContext items={filteredData} strategy={verticalListSortingStrategy}>
          {/* 필터링된 항목들을 매핑하여 SortableItem 컴포넌트로 렌더링 */}
          {filteredData.map((item) => (
            <SortableItem key={item.id} id={item.id} item={item} onClick={() => handleModalOpen(item)} />
          ))}

          {/* 항목이 없을 경우 빈 드롭 영역 표시 */}
          {filteredData.length === 0 && (
            <div className="flex-1 min-h-[200px] border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center text-slate-400">
              이 영역으로 항목을 드래그하세요
            </div>
          )}
        </SortableContext>
      </div>

      {/* 조건부 모달 렌더링 */}
      {isOpen && (
        <BoardDetailModal
          onClose={handleModalClose}
          onConfirm={handleConfirmModalOpen}
          onEdit={handleEditModalOpen}
          item={item}
        />
      )}
      {confirmIsOpen && <BoardConfirmModal onClose={handleConfirmModalClose} id={selectedId} />}
      {editIsOpen && <BoardEditModal onClose={handleEditModalClose} item={item} />}
    </div>
  );
};

export default Boards;

// SortableItem: 드래그 가능한 개별 항목 컴포넌트
// id: 항목의 고유 ID
// item: 항목 데이터 객체
// onClick: 항목 클릭 시 실행할 함수
const SortableItem = ({ id, item, onClick }) => {
  // useSortable: 항목을 드래그 가능하도록 설정하는 dnd-kit 훅
  // attributes: 접근성 관련 속성 (aria-*)
  // listeners: 드래그 이벤트 리스너
  // setNodeRef: 이 요소를 드래그 가능한 항목으로 등록하는 ref 함수
  // transform: 드래그 중 위치 변환 정보 (x, y 좌표)
  // transition: 애니메이션 전환 정보
  // isDragging: 현재 이 항목이 드래그 중인지 여부
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // 항목의 인라인 스타일 설정
  const itemStyle = {
    // transform: 드래그 중일 때 항목의 위치를 변경 (CSS Transform)
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    // transition: 부드러운 애니메이션을 위한 전환 효과
    transition,
    // 드래그 중일 때 원래 위치의 항목을 반투명하게 표시
    opacity: isDragging ? 0.3 : 1,
    // 드래그 중인 항목이 다른 항목보다 위에 보이도록 z-index 설정
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      // setNodeRef: 이 요소를 드래그 가능한 항목으로 등록
      ref={setNodeRef}
      // 드래그 중 스타일 적용
      style={itemStyle}
      // attributes: dnd-kit에서 제공하는 접근성 속성 (aria-*)
      {...attributes}
      // listeners: 드래그 이벤트를 감지하는 리스너 (마우스/터치 이벤트)
      {...listeners}
      // 항목 클릭 시 상세 모달 열기
      onClick={onClick}
      className="bg-white hover:bg-stone-100 shadow-md rounded-md p-4 cursor-pointer mb-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        {/* 항목 타입에 따른 상태 표시 (색상 구분) */}
        {item.type === 'todo' && <div className="animate-pulse w-2 h-2 rounded-full bg-green-500"></div>}
        {item.type === 'inprogress' && <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500"></div>}
        {item.type === 'done' && <div className="animate-pulse w-2 h-2 rounded-full bg-red-500"></div>}
      </div>
      <p className="text-sm text-gray-500">{item.created_at}</p>
    </div>
  );
};
