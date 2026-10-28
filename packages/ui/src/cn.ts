import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 조건부 클래스를 합치고, 충돌하는 Tailwind 유틸리티는 뒤쪽(소비자) 값이 이기도록 정리한다. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
