import { ChangeEvent } from "react";
import { User } from "../../types/User";

interface SearchInputProps {
    field: keyof User;
    handleSearch: (e: ChangeEvent<HTMLInputElement>, field: keyof User) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ field, handleSearch }) => (
    <div>
        <input type="text" placeholder="Search" onChange={e => handleSearch(e, field)} />
    </div>
);

export default SearchInput;