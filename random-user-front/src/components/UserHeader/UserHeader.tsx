import { ChangeEvent } from "react";
import { SortOrder } from "../../types/ShortOrder";
import { User } from "../../types/User";
import SearchInput from "../SearchInput/SearchInput";

interface UserHeaderProps {
    field: keyof User;
    sort: { field: keyof User | '', order: SortOrder };
    handleSort: (field: keyof User) => void;
    handleSearch: (e: ChangeEvent<HTMLInputElement>, field: keyof User) => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ field, sort, handleSort, handleSearch }) => (
    <th>
        <div>
            <div onClick={() => handleSort(field)}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sort.field === field && (sort.order === SortOrder.ASC ? ' ▲' : ' ▼')}
            </div>
            <SearchInput field={field} handleSearch={handleSearch} />
        </div>
    </th>
);

export default UserHeader;
