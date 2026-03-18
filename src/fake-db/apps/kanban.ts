import type { KanbanType } from '@/types/apps/kanbanTypes'

export const db: KanbanType = {
  columns: [
    {
      id: 1,
      title: '대기중',
      taskIds: [1]
    },
    {
      id: 2,
      title: '진행중',
      taskIds: [2]
    },
    {
      id: 3,
      title: '완료',
      taskIds: [3]
    }
  ],
  tasks: [
    {
      id: 1,
      title: '홈페이지 리뉴얼',
      company: '스튜디오언네임드',
      category: '홈페이지',
      amount: 5500000,
      status: '대기중',
      date: '2026-03-01',
      advance: 1500000,
      advanceDate: '2026-03-02',
      balanceDate: '2026-04-01',
      taxDate: '2026-04-05'
    },
    {
      id: 2,
      title: '브랜드 홍보 영상 제작',
      company: '언네임드 디자인',
      category: '영상',
      amount: 12000000,
      status: '진행중',
      date: '2026-02-15',
      advance: 4000000,
      advanceDate: '2026-02-16',
      balanceDate: '2026-03-20',
      taxDate: '2026-03-25'
    },
    {
      id: 3,
      title: '사내 연수 편집디자인',
      company: '메타버스 테크',
      category: '편집디자인',
      amount: 3000000,
      status: '완료',
      date: '2026-01-20',
      advance: 1000000,
      advanceDate: '2026-01-21',
      balanceDate: '2026-02-10',
      taxDate: '2026-02-15'
    }
  ]
}
