export type Review = {
    id: string;
    shopId: string;
    userId: string;
    displayName: string;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: { seconds: number; nanoseconds: number };
};
