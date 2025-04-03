import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Zustand를 사용한 전역 상태 관리 스토어
// useBoardStore: 칸반 보드 관련 상태와 액션을 관리하는 스토어
export const useBoardStore = create(
  // persist: 로컬 스토리지에 상태를 저장하고 불러오는 미들웨어
  // 페이지 새로고침 후에도 데이터가 유지됨
  persist(
    // set: 상태를 업데이트하는 함수
    (set) => ({
      // 기본 상태
      data: [], // 모든 보드 항목을 저장하는 배열

      // 새 항목 추가 액션
      // newBoard: 추가할 새 항목 객체
      addBoard: (newBoard) => set((state) => ({ data: [...state.data, newBoard] })),

      // 항목 삭제 액션
      // id: 삭제할 항목의 고유 ID
      removeBoard: (id) => set((state) => ({ data: state.data.filter((item) => item.id !== id) })),

      // 항목 업데이트 액션
      // updatedBoard: 업데이트된 항목 객체 (id는 기존 항목과 동일해야 함)
      updateBoard: (updatedBoard) =>
        set((state) => ({
          // map을 사용하여 특정 항목만 업데이트
          data: state.data.map((item) => (item.id === updatedBoard.id ? updatedBoard : item)),
        })),

      // 항목의 보드 타입 변경 액션 (드래그 앤 드롭으로 다른 보드로 이동할 때 사용)
      // id: 변경할 항목의 고유 ID
      // newType: 새 보드 타입 ('todo', 'inprogress', 'done' 중 하나)
      updateBoardType: (id, newType) =>
        set((state) => ({
          // 특정 항목의 type 속성만 변경
          data: state.data.map((item) => (item.id === id ? { ...item, type: newType } : item)),
        })),

      // 항목들의 순서 재정렬 액션 (동일 보드 내에서 항목 순서 변경 시 사용)
      // newData: 재정렬된 전체 항목 배열
      reorderItems: (newData) => set({ data: newData }),
    }),
    {
      // 로컬 스토리지 설정
      name: 'board-storage', // 로컬 스토리지에 저장될 키 이름
      storage: createJSONStorage(() => localStorage), // 브라우저의 localStorage 사용
    }
  )
);
