import { Droppable } from 'react-beautiful-dnd';
import styles from './../../UserTable/UserTable.module.scss';
import { User } from '../../../types/User';
import { SortOrder } from '../../../types/ShortOrder';
import { UserHeader } from '../../UserHeader/UserHeader';
import DraggableUserRow from '../../Rows/DraggableUserRow/DraggableUserRow';

interface UserTableToDragProps {
    users: User[];
    sort: { field: keyof User | '', order: SortOrder };
    selectedRows: User[];
    selectAll: boolean;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => void;
    handleSort: (field: keyof User) => void;
    handleSelect: (user: User) => void;
    handleSelectAll: () => void;
    exportSelectedToCSV: () => void;
}

export const UserTableToDrag: React.FC<UserTableToDragProps> = ({
    users,
    sort,
    selectedRows,
    selectAll,
    handleSearch,
    handleSort,
    handleSelect,
    handleSelectAll,
    exportSelectedToCSV,
}) => {
    return (
        <div className={styles.tableContainer}>
            <button onClick={exportSelectedToCSV}>Export to CSV</button>
            <Droppable droppableId="users">
                {(provided) => (
                    <table
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={styles.table}
                    >
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectAll}
                                    />
                                </th>
                                <UserHeader
                                    field="name"
                                    sort={sort}
                                    handleSort={handleSort}
                                    handleSearch={handleSearch}
                                />
                                <UserHeader
                                    field="gender"
                                    sort={sort}
                                    handleSort={handleSort}
                                    handleSearch={handleSearch}
                                />
                                <UserHeader
                                    field="email"
                                    sort={sort}
                                    handleSort={handleSort}
                                    handleSearch={handleSearch}
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <DraggableUserRow
                                    user={user}
                                    handleSelect={handleSelect}
                                    selected={selectedRows.includes(user)}
                                    index={index}
                                    key={user.email}
                                />
                            ))}
                            {provided.placeholder}
                        </tbody>
                    </table>
                )}
            </Droppable>
        </div>
    );
};