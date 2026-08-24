import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

const meta = {
  title: 'Shadcn/Pagination',
  component: Pagination,
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

const totalPages = 8;

function PaginationDemo() {
  const [page, setPage] = useState(1);

  const goTo = (target: number) => (event: MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(Math.max(target, 1), totalPages));
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={`?page=${page - 1}`} onClick={goTo(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" isActive={page === 1} onClick={goTo(1)}>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive={page === 2} onClick={goTo(2)}>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href={`?page=${totalPages}`}
            isActive={page === totalPages}
            onClick={goTo(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href={`?page=${page + 1}`} onClick={goTo(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export const Default: Story = {
  render: () => <PaginationDemo />,
};
