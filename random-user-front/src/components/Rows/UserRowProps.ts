import { User } from "../../types/User";

export interface UserRowProps {
    user: User;
    handleSelect: (user: User) => void;
    selected: boolean;
}
