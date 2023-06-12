import { useEffect, useState } from 'react';
import { User } from '../interfaces/User';
import { UserService } from '../services/UserService';
import styles from './UserTable.module.scss';

const UserTable = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerms, setSearchTerms] = useState<{ name: string, gender: string, email: string }>({ name: '', gender: '', email: '' });
    const [sort, setSort] = useState<{ field: keyof User | '', order: 'asc' | 'desc' }>({ field: '', order: 'asc' });
    const [selectedRows, setSelectedRows] = useState<User[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        UserService.getRandomUsers()
            .then(setUsers)
            .catch(console.error);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
        setSearchTerms({ ...searchTerms, [field]: e.target.value });
    };

    const handleSort = (field: keyof User) => {
        const isCurrentField = sort.field === field;
        const order = isCurrentField && sort.order === 'asc' ? 'desc' : 'asc';
        setSort({ field, order });
    };

    const handleSelect = (user: User) => {
        if (selectedRows.includes(user)) {
            setSelectedRows(selectedRows.filter(row => row !== user));
        } else {
            setSelectedRows([...selectedRows, user]);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows([...filteredAndSortedUsers]);
        }
        setSelectAll(!selectAll);
    };

    const filteredAndSortedUsers = users
        .filter(user => `${user.name.first} ${user.name.last}`.toLowerCase().includes(searchTerms.name.toLowerCase()))
        .filter(user => user.gender.toLowerCase().includes(searchTerms.gender.toLowerCase()))
        .filter(user => user.email.toLowerCase().includes(searchTerms.email.toLowerCase()))
        .sort((a, b) => {
            if (sort.field) {
                if (sort.field === 'name') {
                    return sort.order === 'asc'
                        ? a.name.first.localeCompare(b.name.first)
                        : b.name.first.localeCompare(a.name.first);
                } else {
                    return sort.order === 'asc'
                        ? String(a[sort.field]).localeCompare(String(b[sort.field]))
                        : String(b[sort.field]).localeCompare(String(a[sort.field]));
                }
            } else {
                return 0;
            }
        });

    const exportToCSV = () => {
        const toExport = selectedRows.length ? selectedRows : users;
        const csv = toExport.map(row => `${row.name.first} ${row.name.last},${row.gender},${row.email}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'export.csv');
        link.click();
    };

    return (
        <>
            <div className={styles.container}>
                <button onClick={exportToCSV}>Export to CSV</button>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" onChange={handleSelectAll} checked={selectAll} />
                            </th>
                            <th>
                                <div>
                                    <div onClick={() => handleSort('name')}>Name {sort.field === 'name' && (sort.order === 'asc' ? ' ▲' : ' ▼')}</div>
                                    <div><input type="text" placeholder="Search" onChange={e => handleSearch(e, 'name')} /></div>
                                </div>
                            </th>
                            <th>
                                <div>
                                    <div onClick={() => handleSort('gender')}>Gender {sort.field === 'gender' && (sort.order === 'asc' ? ' ▲' : ' ▼')}</div>
                                    <div><input type="text" placeholder="Search" onChange={e => handleSearch(e, 'gender')} /></div>
                                </div>
                            </th>
                            <th>
                                <div>
                                    <div onClick={() => handleSort('email')}>Email {sort.field === 'email' && (sort.order === 'asc' ? ' ▲' : ' ▼')}</div>
                                    <div><input type="text" placeholder="Search" onChange={e => handleSearch(e, 'email')} /></div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedUsers.map((user, index) => (
                            <tr key={index} className={selectedRows.includes(user) ? styles.selected : ''}>
                                <td>
                                    <input type="checkbox" onChange={() => handleSelect(user)} checked={selectedRows.includes(user)} />
                                </td>
                                <td>{user.name.first} {user.name.last}</td>
                                <td>{user.gender}</td>
                                <td>{user.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </>
    );
};

export default UserTable;